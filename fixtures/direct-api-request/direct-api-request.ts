import type { Cookie } from '@playwright/test';

type Method = RequestInit['method'];

export const makeDirectApiRequest = async <T>(url: string, method: Method, cookies: Cookie[], body?: T) => {
  const parsedUrl = URL.parse(url);

  if (parsedUrl === null) {
    throw new Error(`${method} ${url} - Invalid URL.`);
  }

  try {
    return await fetch(parsedUrl, {
      method,
      body: JSON.stringify(body),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Cookie: toCookieHeader(parsedUrl, cookies),
      },
    });
  } catch (e) {
    throw new Error(`${method} ${url} - ${toMessage(e)}.`, { cause: e });
  }
};

/** How many `cause` hops to follow. Also guards against a cyclic chain. */
const MAX_CAUSE_DEPTH = 4;

/**
 * Flattens an error and its `cause` chain into a single line.
 *
 * Node's `fetch` rejects with a bare `TypeError: fetch failed` and hides the part you actually
 * need - `ECONNREFUSED`, `ENOTFOUND`, certificate errors - one level down in `cause`. Without this,
 * a failing test reports only `fetch failed`.
 */
export const toMessage = (e: unknown): string => {
  const parts = toParts(e);

  return parts.length === 0 ? 'Unknown error' : parts.join(': ');
};

/** The message of `e` followed by those of its `cause` chain, outermost first. Anything that is not
 * an `Error` contributes nothing, which doubles as the base case for an error without a cause. */
const toParts = (e: unknown, depth = 0): string[] => {
  if (!(e instanceof Error)) {
    return [];
  }

  if (depth >= MAX_CAUSE_DEPTH) {
    return [e.message];
  }

  const cause = e instanceof AggregateError ? [toAlternatives(e, depth)] : toParts(e.cause, depth + 1);

  // Drop empty messages - `AggregateError` has none by default - and any cause that merely repeats
  // its parent, so we never report `fetch failed: fetch failed`.
  return [e.message, ...cause].filter((part, i, all) => part !== '' && part !== all[i - 1]);
};

/** When a host resolves to several addresses, every attempt fails at once and the failures arrive
 * together in an `AggregateError`. They are alternatives rather than a chain, so they read as a
 * comma-separated list instead of being joined with the rest of the chain. */
const toAlternatives = (e: AggregateError, depth: number): string =>
  e.errors.map((error) => toParts(error, depth + 1).join(': ')).join(', ');

/**
 * Builds a `Cookie` header containing only the cookies that actually belong to `url`.
 *
 * Callers hand us everything `BrowserContext.cookies()` returns, which is every cookie in the
 * context across every domain it has talked to - including the handful of large cookies the Azure
 * sign-in leaves behind on `login.microsoftonline.com` (`ESTSAUTHPERSISTENT` alone is several
 * kilobytes). Sending those to Nav's APIs is pointless, and together they push the request past
 * the server's max header size, which fails the request with `431 Request Header Fields Too
 * Large` rather than anything that hints at cookies.
 */
const toCookieHeader = (url: URL, cookies: Cookie[]): string =>
  cookies
    .filter((cookie) => appliesTo(cookie, url))
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

/** Whether a browser would send `cookie` to `url`. See RFC 6265, sections 5.1.3 - 5.4. */
export const appliesTo = (cookie: Cookie, url: URL): boolean =>
  domainMatches(cookie, url.hostname) && pathMatches(cookie, url.pathname) && secureMatches(cookie, url.protocol);

/** A leading dot marks a domain cookie, which also applies to every subdomain. Without it the
 * cookie is host-only, and applies to exactly the host that set it. */
export const domainMatches = ({ domain }: Cookie, hostname: string): boolean =>
  domain.startsWith('.') ? hostname === domain.slice(1) || hostname.endsWith(domain) : hostname === domain;

export const pathMatches = ({ path }: Cookie, pathname: string): boolean =>
  pathname === path || (pathname.startsWith(path) && (path.endsWith('/') || pathname.at(path.length) === '/'));

export const secureMatches = ({ secure }: Cookie, protocol: string): boolean => !secure || protocol === 'https:';
