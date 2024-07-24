import { format } from 'date-fns';
import { test } from '../fixtures/registrering/fixture';
import { FristExtension, Part, PartType, Utskriftstype } from '../fixtures/registrering/types';
import { UI_DOMAIN } from './functions';

const SAKEN_GJELDER = new Part('SPESIFIKK KUBBESTOL', '29461964263', PartType.SAKEN_GJELDER);
const ANKENDE_PART = new Part('FALSK ONKEL', '17887799784', PartType.KLAGER);
const FULLMEKTIG = new Part('FATTET ØRN MUSKEL', '14828897927', PartType.FULLMEKTIG);
const AVSENDER = new Part('HUMORISTISK LOGG', '01046813711', PartType.AVSENDER);
const EKSTRA_MOTTAKER1 = new Part('IVRIG JAK', '29480474455', PartType.EKSTRA_MOTTAKER);
const EKSTRA_MOTTAKER2 = new Part('VIRKELIG VIFTE', '29418813049', PartType.EKSTRA_MOTTAKER);
const EKSTRA_MOTTAKER3 = new Part('KONTANT SOKK', '02518849517', PartType.EKSTRA_MOTTAKER);
const SVARBREV_NAME = 'E2E-dokumentnavn';
const SVARBREV_FULLMEKTIG_NAME = 'E2E-fullmektig';
const SAKEN_GJELDER_ADDRESS_1 = 'E2E-adresselinje1';
const SAKEN_GJELDER_ADDRESS_2 = 'E2E-adresselinje2';
const SAKEN_GJELDER_ADDRESS_3 = 'E2E-adresselinje3';
const SAKEN_GJELDER_LAND = 'SØR-GEORGIA OG SØR-SANDWICHØYENE';
const EXTRA_MOTTAKER_ADDRESS_1 = 'Ekstra mottakers E2E-adresselinje1';
const EXTRA_MOTTAKER_ADDRESS_2 = 'Ekstra mottakers E2E-adresselinje2';
const EXTRA_MOTTAKER_ADDRESS_3 = 'Ekstra mottakers E2E-adresselinje3';
const EXTRA_MOTTAKER_LAND = 'HEARD- OG MCDONALD-ØYENE';

const FRIST_I_KABAL = new FristExtension(69, 'måneder');
const VARSLET_FRIST = new FristExtension(70, 'måneder');

test.describe('Registrering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(UI_DOMAIN);
  });

  // expects are inside ankeStatusPage.
  // eslint-disable-next-line playwright/expect-expect
  test('Anke', async ({ page, kabinPage, ankePage, ankeStatusPage, registreringerPage }) => {
    await registreringerPage.createRegistrering();
    await kabinPage.setSakenGjelder(SAKEN_GJELDER);
    const jpData = await kabinPage.selectJournalpostByInnerText('9705');
    await kabinPage.selectType('anke');
    const { vedtaksdato, ytelse, fagsystem, ...mulighetData } = await ankePage.selectFirstAvailableVedtak();

    await ankePage.verifySaksId(jpData.saksId, mulighetData.saksId);

    await ankePage.setMottattKlageinstans(vedtaksdato);

    await ankePage.setFristIKabal(FRIST_I_KABAL, vedtaksdato);
    await ankePage.setHjemler(
      ['Folketrygdloven - § 15-2', 'Folketrygdloven - § 15-3'],
      ['Ftrl - § 15-2', 'Ftrl - § 15-3'],
    );

    await ankePage.verifySakenGjelder(SAKEN_GJELDER);
    await ankePage.setAnkendePart(ANKENDE_PART);
    await ankePage.setFullmektig(FULLMEKTIG);
    await ankePage.setAvsender(AVSENDER);
    const saksbehandlerName = await ankePage.setFirstAvailableSaksbehandler();

    await page.getByText('Send svarbrev', { exact: true }).click();

    await ankePage.setSvarbrevDocumentName(SVARBREV_NAME);
    await ankePage.setSvarbrevFullmektigName(SVARBREV_FULLMEKTIG_NAME);
    await ankePage.setSvarbrevVarsletFrist(VARSLET_FRIST);
    await ankePage.setSvarbrevFritekst('E2E-fritekst');

    await ankePage.selectMottaker(SAKEN_GJELDER);
    await ankePage.selectMottaker(ANKENDE_PART);
    await ankePage.selectMottaker(FULLMEKTIG);

    await ankePage.seUtskriftTypeForPart(ANKENDE_PART, Utskriftstype.LOKAL);

    await ankePage.changeAddressForPart(
      SAKEN_GJELDER,
      SAKEN_GJELDER_ADDRESS_1,
      SAKEN_GJELDER_ADDRESS_2,
      SAKEN_GJELDER_ADDRESS_3,
      { search: 'sandwich', fullName: SAKEN_GJELDER_LAND },
    );

    await ankePage.addExtraRecipient(EKSTRA_MOTTAKER1);
    await ankePage.addExtraRecipient(EKSTRA_MOTTAKER2);
    await ankePage.addExtraRecipient(EKSTRA_MOTTAKER3);
    await ankePage.setUtskriftTypeForExtraRecipient(EKSTRA_MOTTAKER1, Utskriftstype.LOKAL);
    await ankePage.changeAddressForExtraRecipient(
      EKSTRA_MOTTAKER2,
      EXTRA_MOTTAKER_ADDRESS_1,
      EXTRA_MOTTAKER_ADDRESS_2,
      EXTRA_MOTTAKER_ADDRESS_3,
      { search: 'mcdonald', fullName: EXTRA_MOTTAKER_LAND },
    );

    await kabinPage.finish();

    await ankeStatusPage.verifyJournalførtAnke({
      title: jpData.title,
      tema: mulighetData.tema,
      dato: format(new Date(), 'dd.MM.yyyy'),
      avsenderMottaker: AVSENDER,
      saksId: mulighetData.saksId,
      type: jpData.type,
      logiskeVedleggNames: jpData.logiskeVedleggNames,
      vedleggNames: jpData.vedleggNames,
    });

    await ankeStatusPage.verifySaksinfo({
      mottattKlageinstans: vedtaksdato,
      fristIKabal: FRIST_I_KABAL.getDateAndExtension(vedtaksdato),
      varsletFrist: VARSLET_FRIST.getDateAndExtension(vedtaksdato),
      ankendePart: ANKENDE_PART,
      fullmektig: FULLMEKTIG,
      saksbehandlerName,
    });

    const sakenGjelderAddress = `${SAKEN_GJELDER_ADDRESS_1}, ${SAKEN_GJELDER_ADDRESS_2}, ${SAKEN_GJELDER_ADDRESS_3}, ${SAKEN_GJELDER_LAND}`;
    const extraMottakerAddress = `${EXTRA_MOTTAKER_ADDRESS_1}, ${EXTRA_MOTTAKER_ADDRESS_2}, ${EXTRA_MOTTAKER_ADDRESS_3}, ${EXTRA_MOTTAKER_LAND}`;
    await ankeStatusPage.verifySvarbrevinfo({
      documentName: SVARBREV_NAME,
      mottakere: [
        { name: SAKEN_GJELDER.name, utskrift: 'Sentral utskrift', address: sakenGjelderAddress },
        { name: ANKENDE_PART.name, utskrift: 'Lokal utskrift' },
        { name: FULLMEKTIG.name, utskrift: 'Sentral utskrift' },
        { name: EKSTRA_MOTTAKER1.name, utskrift: 'Lokal utskrift' },
        { name: EKSTRA_MOTTAKER2.name, utskrift: 'Sentral utskrift', address: extraMottakerAddress },
        { name: EKSTRA_MOTTAKER3.name, utskrift: 'Sentral utskrift' },
      ],
    });

    await ankeStatusPage.verifyValgtVedtak({
      sakenGjelder: SAKEN_GJELDER,
      vedtaksdato,
      ytelse,
      fagsystem,
      saksId: mulighetData.saksId,
    });
  });
});
