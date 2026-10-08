import type { Cookie } from '@playwright/test';
import { isAfter, isBefore, parseISO, subDays, subHours, subMinutes } from 'date-fns';
import { makeDirectApiRequest, toMessage } from '@/fixtures/direct-api-request/direct-api-request';
import { deleteKabalBehandling } from '@/fixtures/kabal';
import { deleteKlankeSak, getFagsakCreated, getKlankeSaker, isSakHandledInKabal } from '@/fixtures/klanke';
import { UI_DOMAIN } from '@/tests/functions';
import { TESTDATA } from '@/tests/registrering/testdata';

/**
 * Tests delete what they create when they finish. A run that is killed first, e.g. by `globalTimeout`, leaves
 * its saker behind, holding on to their Gosys-oppgaver. Runs from other repos and developers may be in
 * progress concurrently, so only saker that are older than any run can last are deleted.
 */
const STALE_BEHANDLING_MINUTES = 30;

/**
 * A Klanke sak is created before its registrering is finished, at most one test timeout earlier.
 * Registreringer also appear up to two hours newer than they are. See `FinishedRegistrering.finished`.
 * The Klanke sak must not be considered stale before its behandling is.
 */
const STALE_KLANKE_SAK_HOURS = 3;

/** The maximum Kabin allows. Behandlinger from older registreringer are not found. */
const REGISTRERINGER_DAYS = 31;

/** Klanke saker this old may belong to behandlinger from registreringer that are no longer found. */
const MAX_KLANKE_SAK_DAYS = REGISTRERINGER_DAYS - 1;

const CONCURRENCY = 10;

interface FinishedRegistrering {
  sakenGjelderValue: string;
  /**
   * Local date-time in Europe/Oslo without offset, e.g. `2026-10-08T10:34:23.663058`.
   * Parsed as UTC, which makes it appear one or two hours newer than it is, regardless of where the tests run.
   */
  finished: string;
  behandlingId: string;
}

interface Behandling {
  /** The fagsakId. */
  saksnummer: string;
  isAvsluttetAvSaksbehandler: boolean;
}

/** What remains of a stale behandling after the sweep. */
type BehandlingResult =
  | { status: 'gone' | 'deleted' }
  | { status: 'kept' | 'failed'; fagsakId: string }
  | { status: 'unknown' };

/**
 * Best-effort deletion of Kabal behandlinger and Klanke saker left behind by earlier test runs.
 *
 * Only behandlinger registered in Kabin by the test user for the test persons are deleted. Behandlinger
 * someone has finished are kept, as they may be in use as muligheter.
 * A Klanke sak Kabal has a behandling from is only deleted once that behandling is known to be gone.
 */
export const deleteStaleTestSaker = async (cookies: Cookie[]) => {
  console.info('Deleting stale test saker from earlier runs');

  const now = new Date();
  const fnrSet = new Set(TESTDATA.map(({ sakenGjelder }) => sakenGjelder.id));

  try {
    const results = await deleteStaleBehandlinger(cookies, fnrSet, now);
    await deleteStaleKlankeSaker(results, fnrSet, now);
  } catch (e) {
    console.warn(`Failed to delete stale test saker: ${toMessage(e)}`);
  }
};

const deleteStaleBehandlinger = async (cookies: Cookie[], fnrSet: Set<string>, now: Date) => {
  const res = await makeDirectApiRequest(
    `${UI_DOMAIN}/api/kabin-api/registreringer/ferdige?sidenDager=${REGISTRERINGER_DAYS}`,
    'GET',
    cookies,
  );

  if (!res.ok) {
    throw new Error(`Failed to get finished registreringer - ${res.status}: ${await res.text()}`);
  }

  const registreringer: FinishedRegistrering[] = await res.json();

  const staleBefore = subMinutes(now, STALE_BEHANDLING_MINUTES);

  const stale = registreringer.filter(
    ({ sakenGjelderValue, finished }) =>
      fnrSet.has(sakenGjelderValue) && isBefore(parseISO(`${finished}Z`), staleBefore),
  );

  const results = await mapConcurrently(stale, ({ behandlingId }) => deleteStaleBehandling(cookies, behandlingId));

  const count = (status: BehandlingResult['status']) => results.filter((r) => r.status === status).length;

  console.info(
    `Kabal behandlinger from ${stale.length} stale registrering(er): ${count('deleted')} deleted, ${count('gone')} already gone, ${count('kept')} finished and kept, ${count('failed') + count('unknown')} failed`,
  );

  return results;
};

const deleteStaleBehandling = async (cookies: Cookie[], behandlingId: string): Promise<BehandlingResult> => {
  const res = await makeDirectApiRequest(
    `${UI_DOMAIN}/api/kabal-api/behandlinger/${behandlingId}/detaljer`,
    'GET',
    cookies,
  );

  // Deleting a behandling that does not exist fails with 500, so check first.
  if (res.status === 404) {
    return { status: 'gone' };
  }

  if (!res.ok) {
    console.warn(`Failed to get Kabal behandling ${behandlingId} - ${res.status}: ${await res.text()}`);

    return { status: 'unknown' };
  }

  const { saksnummer, isAvsluttetAvSaksbehandler }: Behandling = await res.json();

  if (isAvsluttetAvSaksbehandler) {
    return { status: 'kept', fagsakId: saksnummer };
  }

  try {
    await deleteKabalBehandling(cookies, behandlingId);

    return { status: 'deleted' };
  } catch (e) {
    console.warn(`Failed to delete Kabal behandling ${behandlingId}: ${toMessage(e)}`);

    return { status: 'failed', fagsakId: saksnummer };
  }
};

const deleteStaleKlankeSaker = async (results: BehandlingResult[], fnrSet: Set<string>, now: Date) => {
  // Without the fagsakId of a remaining behandling, any Klanke sak handled in Kabal may still be in use.
  const keepHandled = results.some(({ status }) => status === 'unknown');

  const remainingFagsakIds = new Set(
    results.flatMap((result) => (result.status === 'kept' || result.status === 'failed' ? [result.fagsakId] : [])),
  );

  const staleBefore = subHours(now, STALE_KLANKE_SAK_HOURS);
  const tooOldBefore = subDays(now, MAX_KLANKE_SAK_DAYS);

  const stale = (await getKlankeSaker()).filter((sak) => {
    const created = getFagsakCreated(sak.fagsakId);

    if (!fnrSet.has(sak.fnr) || created === null || !isBefore(created, staleBefore)) {
      return false;
    }

    if (!isSakHandledInKabal(sak)) {
      return true;
    }

    return !keepHandled && !remainingFagsakIds.has(sak.fagsakId) && isAfter(created, tooOldBefore);
  });

  const deleted = await mapConcurrently(stale, async ({ id }) => {
    try {
      await deleteKlankeSak(id);

      return true;
    } catch (e) {
      console.warn(`Failed to delete Klanke sak ${id}: ${toMessage(e)}`);

      return false;
    }
  });

  console.info(`Klanke saker: ${deleted.filter(Boolean).length} of ${stale.length} stale deleted`);
};

const mapConcurrently = async <T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let next = 0;

  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i] as T);
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));

  return results;
};
