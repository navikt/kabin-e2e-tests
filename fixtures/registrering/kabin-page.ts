import test, { Locator, Page } from '@playwright/test';
import { STATUS_REGEX, feilregistrerAndDelete, getIdFromStatusPage } from '../helpers';
import { Part } from './types';

export class KabinPage {
  constructor(public readonly page: Page) {}

  setSakenGjelder = async (SAKEN_GJELDER: Part) =>
    test.step(`Sett saken gjelder: ${SAKEN_GJELDER.getHumanReadableId()}`, async () => {
      await this.page.getByPlaceholder('Søk etter person').fill(SAKEN_GJELDER.id);
      this.page.getByText(`${SAKEN_GJELDER.name} (${SAKEN_GJELDER.getHumanReadableId()})`);
      await this.page.getByText('Velg', { exact: true }).click();
    });

  #getDocumentsContainer = async () => this.page.locator('section', { hasText: 'Velg journalpost' });

  #selectJournalpost = async (document: Locator) => {
    await document.waitFor();

    const [title, tema, dato, avsenderMottaker, saksId, type] = await document.locator('article > *').allTextContents();

    if (title === null || tema === null || dato === null || avsenderMottaker === null || saksId === null) {
      throw new Error('One or more document data is null');
    }

    const logiskeVedlegg = document.getByRole('list', { name: 'Logiske vedlegg', exact: true }).first();
    const logiskeVedleggNames = await logiskeVedlegg.locator('li').getByTestId('logisk-vedlegg').allTextContents();

    const vedlegg = document.getByRole('list', { name: 'Vedlegg', exact: true }).first();
    const vedleggNames = await vedlegg.locator('li').getByTestId('document-title').allTextContents();

    await document.getByText('Velg').click();

    return { title, tema, dato, avsenderMottaker, saksId, type, logiskeVedleggNames, vedleggNames };
  };

  selectFirstvailableJournalpost = async () =>
    test.step('Velg første mulige journalpost', async () => {
      const documents = await this.#getDocumentsContainer();
      const document = documents
        .getByRole('listitem')
        .filter({ has: this.page.getByText('Velg'), hasNotText: 'Laster...' })
        .first();

      return this.#selectJournalpost(document);
    });

  #getJournalpostByName = async (name: string) => {
    const documents = await this.#getDocumentsContainer();

    return documents.getByRole('listitem').filter({ has: this.page.getByText('Velg'), hasText: name });
  };

  selectJournalpostByInnerText = async (name: string) =>
    test.step(`Velg journalpostlinje som inneholder: ${name}`, async () => {
      const journalpost = (await this.#getJournalpostByName(name)).first();

      return this.#selectJournalpost(journalpost);
    });

  selectType = async (type: 'klage' | 'anke') => {
    switch (type) {
      case 'klage':
        return this.#selectKlage();
      case 'anke':
        return this.#selectAnke();
    }
  };

  #selectAnke = async () =>
    test.step('Velg type: anke', async () => {
      await this.page.getByRole('radio', { name: 'Anke', exact: true }).click();
      this.page.getByText('Velg vedtaket anken gjelder');
    });

  #selectKlage = async () =>
    test.step('Velg type: klage', async () => {
      await this.page.getByRole('radio', { name: 'Klage', exact: true }).click();
      this.page.getByText('Velg vedtaket klagen gjelder');
    });

  finish = async () =>
    test.step('Fullfør registrering', async () => {
      await this.page.getByText('Fullfør').click();
      await this.page.getByText('Bekreft', { exact: true }).click();

      await this.page.waitForURL(STATUS_REGEX, { timeout: 0 });

      const kabalId = getIdFromStatusPage(this.page.url());
      feilregistrerAndDelete(this.page, kabalId);

      await this.page.getByText('Anke opprettet').waitFor();
    });
}
