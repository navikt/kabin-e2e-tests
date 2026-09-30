import { lookup } from 'node:dns/promises';
import { hostname } from 'node:os';
import { DEV_DOMAIN } from '@/tests/functions';

// New pods in NAIS can start before their network policies are enforced, dropping all egress for a while.
// Wait until every host the job depends on is reachable, so tests and reporters don't fail on startup.
const REQUIRED_URLS = [
  DEV_DOMAIN,
  'https://login.microsoftonline.com',
  'https://klage-job-status.ekstern.dev.nav.no',
  'https://slack.com',
];

const MAX_WAIT_MS = 90_000;
const ATTEMPT_TIMEOUT_MS = 5_000;
const RETRY_DELAY_MS = 2_000;

interface CheckResult {
  url: string;
  ok: boolean;
  /** DNS and request outcome, e.g. `DNS 10.6.8.200, request TimeoutError` or `DNS EAI_AGAIN, request ENOTFOUND`. */
  detail: string;
}

/** Extracts the most specific error code, e.g. `ENOTFOUND` from a DNS error or from the `cause` of a failed fetch. */
const getErrorCode = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const { cause } = error;

  if (cause instanceof Error) {
    return 'code' in cause && typeof cause.code === 'string' ? cause.code : cause.message;
  }

  return 'code' in error && typeof error.code === 'string' ? error.code : error.name;
};

/** For diagnostics only. Behind an HTTP proxy, local DNS can fail while requests still work. */
const resolveAddress = async (host: string): Promise<string> => {
  try {
    const { address } = await lookup(host);

    return address;
  } catch (error) {
    return getErrorCode(error);
  }
};

/** Resolves DNS separately from the request, to tell DNS failures apart from dropped connections. */
const check = async (url: string): Promise<CheckResult> => {
  const dns = await resolveAddress(new URL(url).hostname);

  try {
    // Any HTTP response, regardless of status code, means the host is reachable.
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
    });

    return { url, ok: true, detail: `DNS ${dns}, HTTP ${res.status}` };
  } catch (error) {
    return { url, ok: false, detail: `DNS ${dns}, request ${getErrorCode(error)}` };
  }
};

const formatFailures = (results: CheckResult[]) =>
  results
    .filter(({ ok }) => !ok)
    .map(({ url, detail }) => `${url} (${detail})`)
    .join(', ');

export const waitForNetwork = async () => {
  console.debug(`Checking network from pod ${hostname()}.`);

  const start = Date.now();
  let pending = REQUIRED_URLS;

  while (true) {
    const results = await Promise.all(pending.map(check));
    pending = results.filter(({ ok }) => !ok).map(({ url }) => url);

    const elapsed = Date.now() - start;

    if (pending.length === 0) {
      console.debug(`Network ready after ${elapsed} ms.`);
      return;
    }

    if (elapsed >= MAX_WAIT_MS) {
      throw new Error(`Network not ready after ${elapsed} ms. Unreachable: ${formatFailures(results)}`);
    }

    console.warn(`Waiting for network (${elapsed} ms). Unreachable: ${formatFailures(results)}`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }
};
