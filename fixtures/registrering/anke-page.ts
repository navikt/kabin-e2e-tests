/* eslint-disable max-lines */
import test, { Locator, Page, expect } from '@playwright/test';
import { Country, FristExtension, Part, PartType, Utskriftstype } from './types';

export class AnkePage {
  constructor(public readonly page: Page) {}

  selectFirstAvailableVedtak = async () =>
    test.step('Velg første mulige vedtak', async () => {
      const muligheter = this.page.getByRole('table', { name: 'Ankemuligheter' });
      await muligheter.waitFor();

      const mulighet = await muligheter.locator('tbody tr').filter({ has: this.page.getByText('Velg') });
      await mulighet.waitFor();
      const cells = await mulighet.getByRole('cell').all();
      const [type, saksId, tema, ytelse, vedtaksdato, fagsystem] = await Promise.all(
        cells.map(async (cell) => cell.textContent()),
      );

      if (
        type === null ||
        saksId === null ||
        tema === null ||
        ytelse === null ||
        fagsystem === null ||
        vedtaksdato === null
      ) {
        throw new Error('One or more mulighet data is null');
      }

      await mulighet.getByText('Velg').click();

      return { type, saksId, tema, ytelse, vedtaksdato, fagsystem };
    });

  verifySaksId = async (jpSaksId: string, mulighetSaksId: string) => {
    if (jpSaksId !== mulighetSaksId) {
      await test.step(`Verifiser advarsel om at journalpost får ny saksId`, async () => {
        this.page.getByText(
          `Journalposten er tidligere journalført på fagsak-ID ${jpSaksId}. Ved opprettelse av behandling i Kabal vil innholdet kopieres over i en ny journalpost på fagsak-ID ${mulighetSaksId}.`,
        );
      });
    }
  };

  setMottattKlageinstans = async (vedtaksdato: string) =>
    test.step(`Sett Mottatt Klageinstans: ${vedtaksdato}`, async () => {
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await this.page.waitForTimeout(1000);
      await this.page.getByLabel('Mottatt Klageinstans').fill(vedtaksdato);
    });

  setFristIKabal = async (FRIST_I_KABAL: FristExtension, vedtaksdato: string) =>
    test.step(`Sett frist i Kabal: ${FRIST_I_KABAL.getTestLabel(vedtaksdato)}`, async () => {
      const fristSection = this.page.getByRole('region', { name: 'Frist i Kabal' });
      await fristSection.waitFor();

      await fristSection.locator('input').fill(FRIST_I_KABAL.value.toString());
      await fristSection.getByText('måneder', { exact: true }).click();
      const expectedFristIKabal = FRIST_I_KABAL.getExtendedDate(vedtaksdato);

      await fristSection.getByText(expectedFristIKabal).waitFor();
    });

  setHjemler = async (longNames: string[], shortNames: string[]) =>
    test.step(`Sett hjemler: ${shortNames.join(', ')}`, async () => {
      await this.page.getByLabel('Hjemler').click();
      await this.page.getByText('Fjern alle').click();
      await this.page.locator('#hjemmelIdList').filter({ hasNotText: /.+/ }).waitFor();

      for (const longName of longNames) {
        await this.page.getByText(longName, { exact: true }).click();
      }

      for (const shortName of shortNames) {
        await this.page.getByText(shortName, { exact: true }).click();
      }

      await this.page.getByLabel('Hjemler').click();
    });

  verifySakenGjelder = async (part: Part) =>
    test.step(`Verifiser saken gjelder: ${part.getTestLabel()}`, async () => {
      const sakenGjelderContainer = this.page.locator('[id="sakenGjelder"]');
      const sakenGjelder = (await sakenGjelderContainer.textContent())?.replace('Saken gjelder', '').trim();
      expect(sakenGjelder).toBe(part.getNameAndId());
    });

  setAnkendePart = async (part: Part) =>
    test.step(`Sett ankende part: ${part.getTestLabel()}`, async () => {
      const ankendePartContainer = this.page.locator('[id="klager"]');
      await ankendePartContainer.getByText('Endre').click();
      await ankendePartContainer.getByPlaceholder('Søk på ID-nummer').fill(part.id);
      await ankendePartContainer.getByText('Bruk').click();
    });

  setFullmektig = async (part: Part) =>
    test.step(`Sett fullmektig: ${part.getTestLabel()}`, async () => {
      const fullmektigContainer = this.page.locator('[id="fullmektig"]');
      await fullmektigContainer.getByText('Endre').click();
      await fullmektigContainer.getByPlaceholder('Søk på ID-nummer').fill(part.id);
      await fullmektigContainer.getByText('Bruk').click();
    });

  setAvsender = async (part: Part) =>
    test.step(`Sett avsender: ${part.getTestLabel()}`, async () => {
      const fullmektigContainer = this.page.locator('[id="avsender"]');
      await fullmektigContainer.getByText('Endre').click();
      await fullmektigContainer.getByPlaceholder('Søk på ID-nummer').fill(part.id);
      await fullmektigContainer.getByText('Bruk').click();
    });

  setFirstAvailableSaksbehandler = async () =>
    test.step('Sett første tilgjengelige saksbehandler', async () => {
      const saksbehandlerContainer = this.page.locator('[id="saksbehandlerId"]');
      await saksbehandlerContainer.getByLabel('Saksbehandler').selectOption({ index: 1 });
      const saksbehandlerName = await saksbehandlerContainer.locator('option').nth(1).textContent();

      if (saksbehandlerName === null) {
        throw new Error('Could not find saksbehandler name');
      }

      return saksbehandlerName;
    });

  getSvarbrevSection = async () => this.page.getByRole('region', { name: 'Svarbrev' });

  setSvarbrevDocumentName = async (documentName: string) =>
    test.step(`Sett dokumentnavn for svarbrev: ${documentName} `, async () => {
      const svarbrevSection = await this.getSvarbrevSection();
      await svarbrevSection.getByLabel('Dokumentnavn').fill(documentName);
    });

  setSvarbrevFullmektigName = async (fullmektigName: string) =>
    test.step(`Sett navn på fullmektig i svarbrev: ${fullmektigName}`, async () => {
      const svarbrevSection = await this.getSvarbrevSection();
      await svarbrevSection.getByLabel('Navn på fullmektig i brevet').fill(fullmektigName);
    });

  setSvarbrevVarsletFrist = async (varsletFrist: FristExtension) =>
    test.step(`Sett varslet frist i svarbrev: ${varsletFrist.getTestLabel()}`, async () => {
      const svarbrevSection = await this.getSvarbrevSection();
      await svarbrevSection.getByText('Overstyr', { exact: true }).first().click();
      await svarbrevSection.locator('input[id="frist"]').fill(varsletFrist.value.toString());
      await svarbrevSection.getByText(varsletFrist.unit, { exact: true }).click();
      svarbrevSection.getByText(
        'Du har endret foreslått frist med mer enn seks måneder. Er du sikker på at dette er riktig?',
      );
    });

  setSvarbrevFritekst = async (fritekst: string) =>
    test.step(`Sett fritekst i svarbrev: ${fritekst}`, async () => {
      const svarbrevSection = await this.getSvarbrevSection();
      await svarbrevSection.getByText('Overstyr', { exact: true }).last().click();
      await svarbrevSection.getByLabel('Fritekst').fill(fritekst);
    });

  #partTypeToText = (partType: PartType) => {
    switch (partType) {
      case PartType.SAKEN_GJELDER:
        return 'Saken gjelder';
      case PartType.FULLMEKTIG:
        return 'Fullmektig';
      case PartType.KLAGER:
        return 'Ankende part';
      case PartType.AVSENDER:
        return 'Avsender';
      case PartType.EKSTRA_MOTTAKER:
        return 'Ekstra mottaker';
    }
  };

  selectMottaker = async (part: Part) =>
    test.step(`Velg mottaker: ${part.getTestLabelWithType()}`, async () => {
      const svarbrevSection = await this.getSvarbrevSection();
      await svarbrevSection.getByText(`${part.name} (${this.#partTypeToText(part.type)})`).click();
    });

  #getSvarbrevPartSection = async (part: Part) => {
    const svarbrevSection = await this.getSvarbrevSection();

    return svarbrevSection.getByTestId('document-send-recipient-list').getByRole('region', { name: part.name });
  };

  #changeAddress = async (
    partSection: Locator,
    address1?: string,
    address2?: string,
    address3?: string,
    country?: Country,
  ) => {
    await partSection.getByText('Endre', { exact: true }).click();

    if (typeof address1 === 'string') {
      await partSection.getByLabel('Adresselinje 1').fill(address1);
    }

    if (typeof address2 === 'string') {
      await partSection.getByLabel('Adresselinje 2').fill(address2);
    }

    if (typeof address3 === 'string') {
      await partSection.getByLabel('Adresselinje 3').fill(address3);
    }

    if (typeof country !== 'undefined') {
      await partSection.getByLabel('Land').fill(country.search);
      await partSection.getByText(country.fullName).click();
    }

    await partSection.getByText('Lagre').click();
  };

  changeAddressForPart = async (
    part: Part,
    address1?: string,
    address2?: string,
    address3?: string,
    country?: Country,
  ) =>
    test.step(`Endre adresse for part: ${part.getTestLabelWithType()}`, async () => {
      const svarbrevSection = await this.getSvarbrevSection();
      const partSection = svarbrevSection
        .getByTestId('document-send-recipient-list')
        .getByRole('region', { name: part.name });

      return this.#changeAddress(partSection, address1, address2, address3, country);
    });

  changeAddressForExtraRecipient = async (
    part: Part,
    address1?: string,
    address2?: string,
    address3?: string,
    country?: Country,
  ) =>
    test.step(`Endre adresse for ekstra mottaker: ${part.getTestLabelWithType()}`, async () => {
      const list = this.page.getByRole('list', { name: 'Liste over ekstra mottakere' });
      const section = list.getByRole('listitem', { name: part.name });

      return this.#changeAddress(section, address1, address2, address3, country);
    });

  seUtskriftTypeForPart = async (part: Part, type: Utskriftstype) =>
    test.step(`Velg utskriftstype: ${type} for part: ${part.getTestLabelWithType()}`, async () => {
      const section = await this.#getSvarbrevPartSection(part);

      switch (type) {
        case Utskriftstype.LOKAL:
          return section.getByText('Lokal utskrift').click();
        case Utskriftstype.SENTRAL:
          return section.getByText('Sentral utskrift').click();
      }
    });

  setUtskriftTypeForExtraRecipient = async (part: Part, type: Utskriftstype) =>
    test.step(`Velg utskriftstype: ${type} for ekstra mottaker: ${part.getTestLabelWithType()}`, async () => {
      const list = this.page.getByRole('list', { name: 'Liste over ekstra mottakere' });
      const section = list.getByRole('listitem', { name: part.name });

      switch (type) {
        case Utskriftstype.LOKAL:
          return section.getByText('Lokal utskrift').click();
        case Utskriftstype.SENTRAL:
          return section.getByText('Sentral utskrift').click();
      }
    });

  addExtraRecipient = async (part: Part) =>
    test.step(`Legg til ekstra mottaker: ${part.getTestLabelWithType()}`, async () => {
      const svarbrevSection = await this.getSvarbrevSection();
      const ekstraMottakere = svarbrevSection.locator('section', { hasText: 'Ekstra mottakere' });
      const input = ekstraMottakere.locator('input').first();
      await input.fill(part.id);
      await ekstraMottakere.getByText('Legg til mottaker').click();
      await input.filter({ hasNotText: part.id }).waitFor();
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await this.page.waitForTimeout(100);
    });
}
