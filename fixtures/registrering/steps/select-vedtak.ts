import test, { expect, type Locator, type Page } from 'playwright/test';
import { finishedRequest } from '@/fixtures/finished-request';
import {
  type Ankevedtak,
  type Klagevedtak,
  type Omgjøringskravvedtak,
  Sakstype,
  type Vedtak,
} from '@/fixtures/registrering/types';

export const selectFirstAvailableVedtak = (page: Page, type: Sakstype) =>
  test.step('Velg første mulige vedtak', async () => {
    const muligheter = page.getByRole('table', { name: getMuligheterName(type) });
    await muligheter.waitFor({ timeout: 20_000 });
    const rows = muligheter.locator('tbody tr');

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

    const selected = muligheter.getByTestId(id);
    await expect(selected).toHaveAttribute('title', 'Valgt');

    const selectedRow = rows.filter({ has: page.getByTestId(id) });

    const cells = await selectedRow.getByRole('cell').all();

    return getVedtakData(type, cells);
  });

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
  }
};

const getOmgoringskravvedtakData = async (cells: Locator[]): Promise<Omgjøringskravvedtak> => getAnkevedtakData(cells);

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
  }
};
