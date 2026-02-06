import test, { type Locator, type Page } from 'playwright/test';
import { finishedRequest } from '@/fixtures/finished-request';
import { KLAGER_LABEL } from '@/fixtures/registrering/klager-label';
import {
  type Country,
  type FristExtension,
  type Part,
  PartType,
  type Sakstype,
  Utskriftstype,
} from '@/fixtures/registrering/types';

export const setSendSvarbrev = async (page: Page, send: boolean) =>
  test.step(`Velge å${send ? ' ' : ' ikke '}sende svarbrev`, () => {
    page.getByText(send ? 'Send svarbrev' : 'Ikke send svarbrev', { exact: true }).click();
  });

export const setSvarbrevDocumentName = async (page: Page, documentName: string) =>
  test.step(`Sett tittel for svarbrev: ${documentName} `, async () => {
    const svarbrevSection = await getSvarbrevSection(page);
    await svarbrevSection.getByLabel('Dokumentnavn').fill(documentName);
  });

export const setSvarbrevFullmektigName = async (page: Page, fullmektigName: string) =>
  test.step(`Sett navn på fullmektig i svarbrev: ${fullmektigName}`, async () => {
    const svarbrevSection = await getSvarbrevSection(page);
    await svarbrevSection.getByLabel('Navn på fullmektig i brevet').clear();
    await svarbrevSection.getByLabel('Navn på fullmektig i brevet').fill(fullmektigName);
  });

export const setSvarbrevVarsletFrist = async (page: Page, varsletFrist: FristExtension) =>
  test.step(`Sett varslet frist i svarbrev: ${varsletFrist.getTestLabel()}`, async () => {
    const svarbrevSection = await getSvarbrevSection(page);

    const override = page.waitForRequest('**/svarbrev/override-behandlingstid');
    await svarbrevSection.getByText('Overstyr', { exact: true }).first().click();
    await finishedRequest(override, 'Failed to set override for varslet frist');

    const behandlingstidInput = page.waitForRequest('**/svarbrev/behandlingstid');
    await svarbrevSection.locator('input[id="frist"]').fill(varsletFrist.value.toString());
    await svarbrevSection.getByText(varsletFrist.unit, { exact: true }).click();
    await finishedRequest(behandlingstidInput, 'Failed to set varslet frist');

    svarbrevSection.getByText(
      'Du har endret foreslått frist med mer enn seks måneder. Er du sikker på at dette er riktig?',
    );
  });

export const setSvarbrevFritekst = async (page: Page, fritekst: string) =>
  test.step(`Sett fritekst i svarbrev: ${fritekst}`, async () => {
    const svarbrevSection = await getSvarbrevSection(page);
    await svarbrevSection.getByText('Overstyr', { exact: true }).last().click();
    await svarbrevSection.getByLabel('Fritekst', { exact: true }).fill(fritekst);
  });

export const setSvarbrevInitialFritekst = async (page: Page, fritekst: string) =>
  test.step(`Sett valgfri fritekst i svarbrev: ${fritekst}`, async () => {
    const svarbrevSection = await getSvarbrevSection(page);
    await svarbrevSection.getByLabel('Fritekst (valgfri)', { exact: true }).fill(fritekst);
  });

// Unused
export const selectSvarbrevMottaker = async (page: Page, part: Part, type: Sakstype) =>
  test.step(`Velg mottaker: ${part.getTestLabelWithType()}`, async () => {
    const svarbrevSection = await getSvarbrevSection(page);
    await svarbrevSection.getByText(`${part.name} (${partTypeToText(part.type, type)})`).click();
  });

export const setUtskriftTypeForPart = async (page: Page, part: Part, type: Utskriftstype) =>
  test.step(`Velg utskriftstype: ${type} for part: ${part.getTestLabelWithType()}`, async () => {
    const section = await getSvarbrevPartSection(page, part);

    switch (type) {
      case Utskriftstype.LOKAL:
        return section.getByText('Lokal utskrift').click();
      case Utskriftstype.SENTRAL:
        return section.getByText('Sentral utskrift').click();
    }
  });

export const setUtskriftTypeForExtraReceiver = async (page: Page, part: Part, type: Utskriftstype) =>
  test.step(`Velg utskriftstype: ${type} for ekstra mottaker: ${part.getTestLabelWithType()}`, async () => {
    const list = page.getByRole('list', { name: 'Liste over ekstra mottakere' });
    const section = list.getByRole('listitem', { name: part.name });

    const setUtskriftType = page.waitForRequest('**/svarbrev/receivers/*');

    switch (type) {
      case Utskriftstype.LOKAL:
        await section.getByText('Lokal utskrift').click();
        break;
      case Utskriftstype.SENTRAL:
        await section.getByText('Sentral utskrift').click();
        break;
    }

    await finishedRequest(setUtskriftType, 'Failed to set utskrift type for ekstra mottaker');
  });

export const addExtraReceiver = async (page: Page, part: Part) =>
  test.step(`Legg til ekstra mottaker: ${part.getTestLabelWithType()}`, async () => {
    const svarbrevSection = await getSvarbrevSection(page);
    const ekstraMottakere = svarbrevSection.locator('section', { hasText: 'Ekstra mottakere' });
    const input = ekstraMottakere.locator('input').first();
    await input.fill(part.id);
    const addReceiverRequest = page.waitForRequest('**/receivers');
    await ekstraMottakere.getByText('Legg til mottaker').click();
    await finishedRequest(addReceiverRequest, `Failed to add receiver "${part.id}"`);
    await input.filter({ hasNotText: part.id }).waitFor();
    await page.waitForTimeout(500);
  });

export const changeAddressForPart = async (
  page: Page,
  part: Part,
  address1?: string,
  address2?: string,
  address3?: string,
  country?: Country,
) =>
  test.step(`Endre adresse for part: ${part.getTestLabelWithType()}`, async () => {
    const svarbrevSection = await getSvarbrevSection(page);
    const partSection = svarbrevSection
      .getByTestId('document-send-receiver-list')
      .getByRole('region', { name: part.name });

    return changeAddress(partSection, address1, address2, address3, country);
  });

export const changeAddressForExtraReceiver = async (
  page: Page,
  part: Part,
  address1?: string,
  address2?: string,
  address3?: string,
  country?: Country,
) =>
  test.step(`Endre adresse for ekstra mottaker: ${part.getTestLabelWithType()}`, () => {
    const list = page.getByRole('list', { name: 'Liste over ekstra mottakere' });
    const section = list.getByRole('listitem', { name: part.name });

    return changeAddress(section, address1, address2, address3, country);
  });

export const selectMottaker = async (page: Page, part: Part, type: Sakstype) =>
  test.step(`Velg mottaker: ${part.getTestLabelWithType()}`, async () => {
    const svarbrevSection = await getSvarbrevSection(page);
    await svarbrevSection.getByText(`${part.name} (${partTypeToText(part.type, type)})`).click();
  });

const getSvarbrevSection = async (page: Page) => page.getByRole('region', { name: 'Svarbrev' });

const partTypeToText = (partType: PartType, sakstype: Sakstype) => {
  switch (partType) {
    case PartType.SAKEN_GJELDER:
      return 'Saken gjelder';
    case PartType.FULLMEKTIG:
      return 'Fullmektig';
    case PartType.KLAGER:
      return KLAGER_LABEL[sakstype];
    case PartType.AVSENDER:
      return 'Avsender';
    case PartType.EKSTRA_MOTTAKER:
      return 'Ekstra mottaker';
  }
};

const getSvarbrevPartSection = async (page: Page, part: Part) => {
  const svarbrevSection = await getSvarbrevSection(page);

  return svarbrevSection.getByTestId('document-send-receiver-list').getByRole('region', { name: part.name });
};

const LAND_REGEX = /Land.*/;

const changeAddress = async (
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
    await partSection.getByLabel(LAND_REGEX).fill(country.search);
    await partSection.getByText(country.fullName).click();
  }

  await partSection.getByText('Lagre').click();
};
