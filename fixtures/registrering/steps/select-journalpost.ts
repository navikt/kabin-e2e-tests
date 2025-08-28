import { type Page, test } from 'playwright/test';
import { finishedRequest } from '@/fixtures/finished-request';
import { isJournalpostType, type SelectJournalpostParams } from '@/fixtures/registrering/types';

export const selectJournalpost = async (page: Page, params: SelectJournalpostParams) =>
  test.step('Velg journalpost', async () => {
    const journalpost = await findJournalpost(page, params);

    await journalpost.waitFor();

    const [, title, tema, dato, avsenderMottaker, saksId, type] = await journalpost
      .locator('article > *')
      .allTextContents();

    if (
      title === null ||
      tema === null ||
      dato === null ||
      avsenderMottaker === null ||
      saksId === null ||
      type === null
    ) {
      throw new Error('One or more document data is null');
    }

    if (!isJournalpostType(type)) {
      throw new Error(`Unknown journalpost type: ${type}`);
    }

    const logiskeVedlegg = journalpost.getByRole('list', { name: 'Logiske vedlegg', exact: true }).first();
    const logiskeVedleggNames = await logiskeVedlegg.locator('li').getByTestId('logisk-vedlegg').allTextContents();

    const vedlegg = journalpost.getByRole('list', { name: 'Vedlegg', exact: true }).first();
    const vedleggNames = await vedlegg.locator('li').getByTestId('document-title').allTextContents();

    const setJournalpostRequest = page.waitForRequest('**/journalpost-id');
    await journalpost.getByText('Velg').click();
    await finishedRequest(setJournalpostRequest, `Failed to select journalpost "${title}"`);

    await journalpost.locator('button[title="Valgt"]').waitFor();

    return { title, tema, dato, avsenderMottaker, saksId, type, logiskeVedleggNames, vedleggNames };
  });

const findJournalpost = async (page: Page, params: SelectJournalpostParams) => {
  const documents = getDocumentsContainer(page);
  await documents.waitFor();

  await setJournalpostFilters(page, params);

  await documents.getByRole('listitem').first().waitFor();

  const listitems = await documents.getByRole('listitem').all();

  for (const listitem of listitems) {
    const [, title, tema, dato, avsenderMottaker, saksId, type] = await listitem
      .locator('article > *')
      .allTextContents();

    if (params.title !== undefined && title !== params.title) {
      continue;
    }

    if (params.tema !== undefined && tema !== params.tema) {
      continue;
    }

    if (params.date !== undefined && dato !== params.date) {
      continue;
    }

    if (params.avsenderMottaker !== undefined && avsenderMottaker !== params.avsenderMottaker) {
      continue;
    }

    if (params.fagsakId !== undefined && saksId !== params.fagsakId) {
      continue;
    }

    if (params.type !== undefined && type !== params.type) {
      continue;
    }

    return listitem;
  }

  throw new Error(`Could not find journalpost with given parameters: ${JSON.stringify(params)}`);
};

const setJournalpostFilters = async (page: Page, params: SelectJournalpostParams) => {
  await page.getByRole('region', { name: 'Journalpostfiltere' }).waitFor();

  for (const [key, value] of Object.entries(params)) {
    if (key === 'title') {
      await setJournalpostFilterTitle(page, value);
    }

    // TODO date

    if (isJournalpostDropdownFilter(key)) {
      await setJournalpostDropdownFilter(page, JOURNALPOST_FILTER_INDEX[key], value);
    }
  }
};

enum JournalpostFilter {
  TITLE = 'title',
  TEMA = 'tema',
  DATE = 'date',
  AVSENDER_MOTTAKER = 'avsenderMottaker',
  FAGSAK_ID = 'fagsakId',
  TYPE = 'type',
}

const JOURNALPOST_FILTER_VALUES = Object.values(JournalpostFilter);

const isJournalpostFilter = (value: string): value is JournalpostFilter =>
  JOURNALPOST_FILTER_VALUES.includes(value as JournalpostFilter);

const isJournalpostDropdownFilter = (value: string): value is JournalpostFilter =>
  isJournalpostFilter(value) && value !== JournalpostFilter.TITLE && value !== JournalpostFilter.DATE;

const JOURNALPOST_FILTER_INDEX: Record<JournalpostFilter, number> = {
  [JournalpostFilter.TITLE]: 1,
  [JournalpostFilter.TEMA]: 2,
  [JournalpostFilter.DATE]: 3,
  [JournalpostFilter.AVSENDER_MOTTAKER]: 4,
  [JournalpostFilter.FAGSAK_ID]: 5,
  [JournalpostFilter.TYPE]: 6,
};

const setJournalpostFilterTitle = async (page: Page, filter: string) => {
  await getDocumentsContainer(page).getByRole('listitem').first().waitFor();
  const filters = page.getByRole('region', { name: 'Journalpostfiltere' });

  await filters.waitFor();

  await filters.getByPlaceholder('Tittel/journalpost-ID').fill(filter);
};

const setJournalpostDropdownFilter = async (page: Page, index: number, filter: string) => {
  const filters = page.getByRole('region', { name: 'Journalpostfiltere' });

  await filters.locator('> *').nth(index).click();

  await filters.locator('> *').getByText(filter).check();
  await page.keyboard.press('Escape');
};

const getDocumentsContainer = (page: Page) => page.locator('section', { hasText: 'Velg journalpost' });
