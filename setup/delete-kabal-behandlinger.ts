import { type Cookie, chromium } from '@playwright/test';
import { makeDirectApiRequest } from '@/fixtures/direct-api-request/direct-api-request';
import { KABAL_DEV_DOMAIN } from '@/tests/functions';
import { logIn } from '@/tests/helpers';
import { TESTDATA } from '@/tests/registrering/testdata';
import { userSaksbehandler } from '@/tests/test-data';

interface SearchResponse {
  aapneBehandlinger: string[];
  avsluttedeBehandlinger: string[];
  feilregistrerteBehandlinger: string[];
  paaVentBehandlinger: string[];
}

const URL = 'https://kabal.intern.dev.nav.no/api/kabal-search/search/oppgaver';

export const deleteKabalBehandlinger = async (context: string) => {
  console.info(`${context} - Deleting behandlinger in Kabal`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await logIn(page, userSaksbehandler, KABAL_DEV_DOMAIN, KABAL_DEV_DOMAIN);

  const cookies = await page.context().cookies();

  const fnrSet = new Set(TESTDATA.map(({ sakenGjelder: { id } }) => id));

  try {
    const responses = await Promise.all(fnrSet.values().map((fnr) => getOppgaver(fnr, cookies)));
    const json: unknown[] = await Promise.all(responses.filter((res) => res.ok).map((res) => res.json()));
    const searchResponses = json.filter(isSearchResponse);

    if (searchResponses.length !== json.length) {
      console.warn(`${context} - ${json.length - searchResponses.length} response(s) did not match the expected shape`);
    }

    const behandlinger = new Set(
      searchResponses.flatMap(({ aapneBehandlinger, paaVentBehandlinger, feilregistrerteBehandlinger }) => [
        ...aapneBehandlinger,
        ...paaVentBehandlinger,
        ...feilregistrerteBehandlinger,
      ]),
    );

    console.info(`${context} - Found ${behandlinger.size} behandling(er) to delete for ${fnrSet.size} person(er)`);

    let deleted = 0;
    let failed = 0;

    for (const id of behandlinger) {
      const response = await deleteBehandling(cookies, id);

      if (response.ok) {
        console.info(`${context} - Deleted:`, id);
        deleted++;
      } else {
        const text = await response.text();
        console.warn(`${context} - ${id}: Deletion failed - ${text}`);
        failed++;
      }
    }

    console.info(`${context} - Deleted: ${deleted} behandling(er)`);
    console.info(`${context} - Failed to delete: ${failed} behandling(er)`);
  } catch (e) {
    console.error(`${context} - Error while deleting behandlinger:`, e);
  }
};

const SEARCH_RESPONSE_KEYS = [
  'aapneBehandlinger',
  'avsluttedeBehandlinger',
  'feilregistrerteBehandlinger',
  'paaVentBehandlinger',
];

const isSearchResponse = (record: unknown): record is SearchResponse => {
  if (!isRecord(record)) {
    return false;
  }

  return SEARCH_RESPONSE_KEYS.every((key) => key in record && Array.isArray(record[key]));
};

const isRecord = (record: unknown): record is Record<string, unknown> => typeof record === 'object' && record !== null;

const getOppgaver = async (query: string, cookies: Cookie[]) => makeDirectApiRequest(URL, 'POST', cookies, { query });

const deleteBehandling = async (cookies: Cookie[], oppgaveId: string) =>
  makeDirectApiRequest(
    `https://kabal.intern.dev.nav.no/api/kabal-api/internal/dev/behandlinger/${oppgaveId}`,
    'DELETE',
    cookies,
  );
