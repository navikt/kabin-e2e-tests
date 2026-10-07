import test, { expect, type Locator, type Page } from '@playwright/test';
import { finishedRequest } from '@/fixtures/finished-request';
import type { KlankeMulighet } from '@/fixtures/klanke';
import { selectFirstAvailableTidligereKabalbehandling } from '@/fixtures/registrering/steps/select-tidligere-kabalbehandling';
import {
  type Ankevedtak,
  type Gjenopptaksvedtak,
  type Klagevedtak,
  type Omgjøringskravvedtak,
  Sakstype,
  type Vedtak,
} from '@/fixtures/registrering/types';

interface SelectMulighetResponse {
  additionalKabalMuligheter: unknown[];
}

/** Identifies a mulighet by the cells Kabin shows for it. */
export interface MulighetFilter {
  fagsakId: string;
  /** The fagsystem the vedtak was made in, as Kabin shows it. Kabal behandlinger show the fagsystem they came from. */
  fagsystem: string;
  /** The date column of the mulighet - vedtaksdato or kjennelsesdato. Omit when Kabin does not show it. */
  date?: string;
}

/**
 * Kabin shows "Ukjent" as vedtaksdato for Infotrygd ankemuligheter, so only klagemuligheter can be told apart by it.
 * Ankemuligheter from Infotrygd are still unambiguous: Kabal leaves its Infotrygd klager out of that table, so
 * every Infotrygd row in it comes from Klanke.
 */
export const getKlankeMulighetFilter = ({ sakstype, fagsakId, vedtaksdato }: KlankeMulighet): MulighetFilter => ({
  fagsakId,
  fagsystem: 'Infotrygd',
  date: sakstype === 'KLAGE' ? vedtaksdato : undefined,
});

/**
 * Selects the first selectable vedtak with the given tema. The tema decides which ytelse and hjemler
 * are available, so it must match the hjemler the test sets. Given a filter, only matching muligheter are
 * considered.
 *
 * Also selects the tidligere behandling in Kabal the vedtak concerns, when Kabin requires one.
 */
export const selectFirstAvailableVedtak = (
  page: Page,
  type: Sakstype,
  tema: string,
  mulighetFilter?: MulighetFilter,
): Promise<Vedtak> =>
  test.step(`Velg første mulige vedtak med tema ${tema}`, async () => {
    const muligheter = page.getByRole('table', { name: getMuligheterName(type) });
    await muligheter.waitFor({ timeout: 20_000 });
    const rows = filterMulighet(
      page,
      muligheter.locator('tbody tr').filter({ has: page.getByRole('cell', { name: tema, exact: true }) }),
      mulighetFilter,
    );

    const mulighet = rows.filter({ has: page.getByRole('button', { name: 'Velg' }) }).first();
    await mulighet.waitFor();

    const selectMulighetRequest = page.waitForRequest('**/registreringer/**/mulighet');

    const button = rows.getByRole('button', { name: 'Velg' }).first();

    const id = await button.getAttribute('data-testid');

    if (id === null) {
      throw new Error('Could not find data-testid attribute on td holding select button');
    }

    await button.click();
    await finishedRequest(selectMulighetRequest, `Failed to select mulighet "${id}"`);

    const response = await (await selectMulighetRequest).response();

    if (response === null) {
      throw new Error(`No response when selecting mulighet "${id}"`);
    }

    const { additionalKabalMuligheter }: SelectMulighetResponse = await response.json();

    const selected = muligheter.getByTestId(id);
    await expect(selected).toHaveAttribute('title', 'Valgt');

    const selectedRow = rows.filter({ has: page.getByTestId(id) });

    const cells = await selectedRow.getByRole('cell').all();

    const vedtak = await getVedtakData(type, cells);

    if (additionalKabalMuligheter.length > 0) {
      await selectFirstAvailableTidligereKabalbehandling(page);
    }

    return vedtak;
  });

const filterMulighet = (page: Page, rows: Locator, filter: MulighetFilter | undefined): Locator => {
  if (filter === undefined) {
    return rows;
  }

  const fagsakRows = rows
    .filter({ has: page.getByRole('cell', { name: filter.fagsakId, exact: true }) })
    .filter({ has: page.getByRole('cell', { name: filter.fagsystem, exact: true }) });

  return filter.date === undefined
    ? fagsakRows
    : fagsakRows.filter({ has: page.getByRole('cell', { name: filter.date, exact: true }) });
};

const getVedtakData = async (type: Sakstype, cells: Locator[]): Promise<Vedtak> => {
  switch (type) {
    case Sakstype.KLAGE: {
      const data = await getKlagevedtakData(cells);

      return { data, type };
    }
    case Sakstype.ANKE: {
      const data = await getAnkevedtakData(cells);

      return { data, type };
    }
    case Sakstype.OMGJØRINGSKRAV: {
      const data = await getOmgoringskravvedtakData(cells);

      return { data, type };
    }
    case Sakstype.BEGJÆRING_OM_GJENOPPTAK: {
      const data = await getGjenopptaksvedtakData(cells);

      return { data, type };
    }
  }
};

const getOmgoringskravvedtakData = async (cells: Locator[]): Promise<Omgjøringskravvedtak> => getAnkevedtakData(cells);

const getGjenopptaksvedtakData = async (cells: Locator[]): Promise<Gjenopptaksvedtak> => getAnkevedtakData(cells);

const getAnkevedtakData = async (cells: Locator[]): Promise<Ankevedtak> => {
  const [type, fagsakId, tema, ytelse, vedtaksdato, fagsystem] = await Promise.all(
    cells.map(async (cell) => cell.textContent()),
  );

  if (
    type === null ||
    fagsakId === null ||
    tema === null ||
    ytelse === null ||
    fagsystem === null ||
    vedtaksdato === null
  ) {
    throw new Error('One or more mulighet data is null');
  }

  return { type, fagsakId, tema, ytelse, vedtaksdato, fagsystem };
};

const getKlagevedtakData = async (cells: Locator[]): Promise<Klagevedtak> => {
  const [fagsakId, tema, vedtaksdato, behandlendeEnhet, fagsystem] = await Promise.all(
    cells.map(async (cell) => cell.textContent()),
  );

  if (fagsakId === null || tema === null || vedtaksdato === null || behandlendeEnhet === null || fagsystem === null) {
    throw new Error('One or more mulighet data is null');
  }

  return { fagsakId, tema, vedtaksdato, behandlendeEnhet, fagsystem };
};

const getMuligheterName = (type: Sakstype) => {
  switch (type) {
    case Sakstype.KLAGE:
      return 'Klagemuligheter';
    case Sakstype.ANKE:
      return 'Ankemuligheter';
    case Sakstype.OMGJØRINGSKRAV:
      return 'Omgjøringskravmuligheter';
    case Sakstype.BEGJÆRING_OM_GJENOPPTAK:
      return 'Muligheter for begjæring om gjenopptak';
  }
};
