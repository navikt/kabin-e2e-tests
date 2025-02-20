import { type Cookie, chromium } from '@playwright/test';
import { makeDirectApiRequest } from '../fixtures/direct-api-request';
import { KABAL_DEV_DOMAIN, KABAL_LOCAL_DOMAIN, KABAL_UI_DOMAIN } from '../tests/functions';
import { logIn } from '../tests/helpers';
import { SAKEN_GJELDER_ANKE, SAKEN_GJELDER_KLAGE, SAKEN_GJELDER_OMGJØRINGSKRAV } from '../tests/registrering/testdata';
import { userSaksbehandler } from '../tests/test-data';

interface SearchResponse {
  aapneBehandlinger: string[];
  avsluttedeBehandlinger: string[];
  feilregistrerteBehandlinger: string[];
  paaVentBehandlinger: string[];
}

export const feilregistrerKabalBehandlinger = async () => {
  console.info('Feilregistrerer and deleting behandlinger in Kabal');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await logIn(page, userSaksbehandler, KABAL_DEV_DOMAIN, KABAL_LOCAL_DOMAIN, KABAL_UI_DOMAIN);

  const cookies = await page.context().cookies();

  const url = 'https://kabal.intern.dev.nav.no/api/kabal-search/search/oppgaver';
  const getOppgaver = async (query: string) => makeDirectApiRequest(url, 'POST', cookies, { query });

  const ankeSearch = await getOppgaver(SAKEN_GJELDER_ANKE.id);
  const klageSearch = await getOppgaver(SAKEN_GJELDER_KLAGE.id);
  const omgjøringskravSearch = await getOppgaver(SAKEN_GJELDER_OMGJØRINGSKRAV.id);

  if (!(ankeSearch.ok && klageSearch.ok && omgjøringskravSearch.ok)) {
    const text = await ankeSearch.text();

    throw new Error(`Failed to search for open behandlinger: ${text}`);
  }

  const anker: SearchResponse = await ankeSearch.json();
  const klager: SearchResponse = await klageSearch.json();
  const omgjøringskrav: SearchResponse = await omgjøringskravSearch.json();

  const behandlingerToFeilregistrere = Array.from(
    new Set([
      ...anker.aapneBehandlinger,
      ...anker.paaVentBehandlinger,
      ...klager.aapneBehandlinger,
      ...klager.paaVentBehandlinger,
      ...omgjøringskrav.aapneBehandlinger,
      ...omgjøringskrav.paaVentBehandlinger,
    ]),
  );

  let feilregistrert = 0;
  let alreadyFeilregistrert = 0;

  for (const id of behandlingerToFeilregistrere) {
    const response = await feilregistrer(cookies, id);

    const text = await response.text();

    if (text.includes('Behandlingen er feilregistrert')) {
      console.info(`${id}: Behandlingen er allerede feilregistrert`);
      alreadyFeilregistrert++;

      continue;
    }

    if (!response.ok) {
      throw new Error(`${id}: Feilregistrering failed - ${text}`);
    }

    console.info('Feilregistrert:', id);

    feilregistrert++;
  }

  console.info(`Feilregistrert: ${feilregistrert} behandling(er)`);
  console.info(`Already feilregistrert (skipped): ${alreadyFeilregistrert} behandling(er)`);

  const behandlingerToDelete = Array.from(
    new Set([
      ...behandlingerToFeilregistrere,
      ...anker.feilregistrerteBehandlinger,
      ...klager.feilregistrerteBehandlinger,
      ...omgjøringskrav.feilregistrerteBehandlinger,
    ]),
  );

  let deleted = 0;
  let failed = 0;

  for (const id of behandlingerToDelete) {
    const response = await deleteBehandling(cookies, id);

    if (response.ok) {
      console.info('Deleted:', id);
      deleted++;
    } else {
      const text = await response.text();
      console.warn(`${id}: Deletion failed - ${text}`);
      failed++;
    }
  }

  console.info(`Deleted: ${deleted} behandling(er)`);
  console.info(`Failed to delete: ${failed} behandling(er)`);
};

const feilregistrer = async (cookies: Cookie[], oppgaveId: string) =>
  makeDirectApiRequest(
    `https://kabal.intern.dev.nav.no/api/kabal-api/behandlinger/${oppgaveId}/feilregistrer`,
    'POST',
    cookies,
    { reason: 'Reservert testbruker' },
  );

const deleteBehandling = async (cookies: Cookie[], oppgaveId: string) =>
  makeDirectApiRequest(
    `https://kabal.intern.dev.nav.no/api/kabal-api/internal/dev/behandlinger/${oppgaveId}`,
    'DELETE',
    cookies,
  );
