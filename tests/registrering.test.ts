import { format } from 'date-fns';
import { test } from '../fixtures/registrering/fixture';
import { FristExtension, Part, PartType, Sakstype, Utskriftstype } from '../fixtures/registrering/types';
import { UI_DOMAIN } from './functions';

const SAKEN_GJELDER_ANKE = new Part('SPESIFIKK KUBBESTOL', '29461964263', PartType.SAKEN_GJELDER);
const SAKEN_GJELDER_KLAGE = new Part('SKEPTISK LANDSBY', '16036832758', PartType.SAKEN_GJELDER);
const ANKENDE_PART = new Part('FALSK ONKEL', '17887799784', PartType.KLAGER);
const FULLMEKTIG = new Part('FATTET ØRN MUSKEL', '14828897927', PartType.FULLMEKTIG);
const AVSENDER = new Part('HUMORISTISK LOGG', '01046813711', PartType.AVSENDER);
const EKSTRA_MOTTAKER1 = new Part('IVRIG JAK', '29480474455', PartType.EKSTRA_MOTTAKER);
const EKSTRA_MOTTAKER2 = new Part('SANNSYNLIG MEDISIN', '06049939084', PartType.EKSTRA_MOTTAKER);
const EKSTRA_MOTTAKER3 = new Part('DRIFTIG HVITKLØVER', '25046846764', PartType.EKSTRA_MOTTAKER);
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

const FRIST_I_KABAL = new FristExtension(68, 'måneder');
const VARSLET_FRIST = new FristExtension(70, 'måneder');

const ANKE = {
  type: Sakstype.ANKE,
  sakenGjelder: SAKEN_GJELDER_ANKE,
  getJournalpostParams: {
    fagsakId: '200053764',
    title: 'document.pdf',
    date: '20.08.2024',
    avsenderMottaker: 'HUMORISTISK LOGG',
  },
  hjemlerLong: ['Folketrygdloven - § 15-2', 'Folketrygdloven - § 15-3'],
  hjemlerShort: ['Ftrl - § 15-2', 'Ftrl - § 15-3'],
  mottattKlageinstans: '18.07.2023',
  tildeltSaksbehandler: 'F_Z994488 E_Z994488',
};

const KLAGE = {
  type: Sakstype.KLAGE,
  sakenGjelder: SAKEN_GJELDER_KLAGE,
  getJournalpostParams: {
    fagsakId: '25598148',
    title: 'a-inntekt_2022-07-18',
    date: '18.07.2022',
  },
  hjemlerLong: ['Folketrygdloven - § 8-2', 'Folketrygdloven - § 22-17'],
  hjemlerShort: ['Ftrl - § 8-2', 'Ftrl - § 22-17'],
  mottattKlageinstans: '26.07.2024',
  tildeltSaksbehandler: 'F_Z994864 E_Z994864',
};

test.describe('Registrering', () => {
  test.beforeEach(({ page }) => page.goto(UI_DOMAIN));

  test.afterEach(async ({ kabinPage }, { status }) => {
    if (status !== 'passed') {
      await kabinPage.deleteRegistrering();
    }
  });

  [KLAGE, ANKE].forEach(
    ({
      type,
      sakenGjelder,
      getJournalpostParams,
      hjemlerLong,
      hjemlerShort,
      mottattKlageinstans,
      tildeltSaksbehandler,
    }) => {
      // expects are inside statusPage.
      // eslint-disable-next-line playwright/expect-expect
      test(`${type}`, async ({ registreringerPage, kabinPage, statusPage, klagePage }) => {
        await registreringerPage.createRegistrering();

        await kabinPage.setSakenGjelder(sakenGjelder);

        const jpData = await kabinPage.selectJournalpostByInnerText(getJournalpostParams);

        await kabinPage.selectType(type);
        const vedtak = await kabinPage.selectFirstAvailableVedtak(type);

        const saksId = vedtak.type === Sakstype.KLAGE ? vedtak.data.fagsakId : vedtak.data.saksId;

        await kabinPage.verifySaksId(jpData.saksId, saksId);

        if (type === Sakstype.KLAGE) {
          await klagePage.setMottattVedtaksinstans(jpData.dato);
        }

        await kabinPage.setMottattKlageinstans(mottattKlageinstans);

        await kabinPage.setFristIKabal(FRIST_I_KABAL, mottattKlageinstans);
        await kabinPage.setHjemler(hjemlerLong, hjemlerShort);

        await kabinPage.verifySakenGjelder(sakenGjelder);
        await kabinPage.setAnkendePart(ANKENDE_PART);
        await kabinPage.setFullmektig(FULLMEKTIG);

        if (jpData.type === 'I') {
          await kabinPage.setAvsender(AVSENDER);
        }

        await kabinPage.setSaksbehandler(tildeltSaksbehandler);

        await kabinPage.setSendSvarbrev(true);
        await kabinPage.setSvarbrevDocumentName(SVARBREV_NAME);
        await kabinPage.setSvarbrevFullmektigName(SVARBREV_FULLMEKTIG_NAME);
        await kabinPage.setSvarbrevVarsletFrist(VARSLET_FRIST);
        await kabinPage.setSvarbrevFritekst('E2E-fritekst');

        await kabinPage.selectMottaker(sakenGjelder);
        await kabinPage.selectMottaker(ANKENDE_PART);
        await kabinPage.selectMottaker(FULLMEKTIG);

        await kabinPage.setUtskriftTypeForPart(ANKENDE_PART, Utskriftstype.LOKAL);

        await kabinPage.changeAddressForPart(
          sakenGjelder,
          SAKEN_GJELDER_ADDRESS_1,
          SAKEN_GJELDER_ADDRESS_2,
          SAKEN_GJELDER_ADDRESS_3,
          { search: 'sandwich', fullName: SAKEN_GJELDER_LAND },
        );

        await kabinPage.addExtraReceiver(EKSTRA_MOTTAKER1);
        await kabinPage.addExtraReceiver(EKSTRA_MOTTAKER2);
        await kabinPage.addExtraReceiver(EKSTRA_MOTTAKER3);
        await kabinPage.setUtskriftTypeForExtraReceiver(EKSTRA_MOTTAKER1, Utskriftstype.LOKAL);
        await kabinPage.changeAddressForExtraReceiver(
          EKSTRA_MOTTAKER2,
          EXTRA_MOTTAKER_ADDRESS_1,
          EXTRA_MOTTAKER_ADDRESS_2,
          EXTRA_MOTTAKER_ADDRESS_3,
          { search: 'mcdonald', fullName: EXTRA_MOTTAKER_LAND },
        );

        await kabinPage.finish(type);

        await statusPage.verifyJournalførtDocument(
          {
            title: jpData.title,
            tema: vedtak.data.tema,
            dato: jpData.saksId === saksId ? jpData.dato : format(new Date(), 'dd.MM.yyyy'),
            avsenderMottaker: jpData.type === 'N' ? 'Ingen' : AVSENDER.getNameAndId(),
            saksId,
            type: jpData.type,
            logiskeVedleggNames: jpData.logiskeVedleggNames,
            vedleggNames: jpData.vedleggNames,
          },
          type,
        );

        await statusPage.verifySaksinfo(
          {
            mottattKlageinstans,
            fristIKabal: FRIST_I_KABAL.getDateAndExtension(mottattKlageinstans),
            varsletFrist: VARSLET_FRIST.getDateAndExtension(mottattKlageinstans),
            klager: ANKENDE_PART,
            fullmektig: FULLMEKTIG,
            saksbehandlerName: tildeltSaksbehandler,
          },
          type,
        );

        const sakenGjelderAddress = `${SAKEN_GJELDER_ADDRESS_1}, ${SAKEN_GJELDER_ADDRESS_2}, ${SAKEN_GJELDER_ADDRESS_3}, ${SAKEN_GJELDER_LAND}`;
        const extraMottakerAddress = `${EXTRA_MOTTAKER_ADDRESS_1}, ${EXTRA_MOTTAKER_ADDRESS_2}, ${EXTRA_MOTTAKER_ADDRESS_3}, ${EXTRA_MOTTAKER_LAND}`;
        await statusPage.verifySvarbrevinfo({
          documentName: SVARBREV_NAME,
          mottakere: [
            { name: sakenGjelder.name, utskrift: 'Sentral utskrift', address: sakenGjelderAddress },
            { name: ANKENDE_PART.name, utskrift: 'Lokal utskrift' },
            { name: FULLMEKTIG.name, utskrift: 'Sentral utskrift' },
            { name: EKSTRA_MOTTAKER1.name, utskrift: 'Lokal utskrift' },
            { name: EKSTRA_MOTTAKER2.name, utskrift: 'Sentral utskrift', address: extraMottakerAddress },
            { name: EKSTRA_MOTTAKER3.name, utskrift: 'Sentral utskrift' },
          ],
        });

        const ytelse = vedtak.type === Sakstype.ANKE ? vedtak.data.ytelse : undefined;

        const { vedtaksdato, fagsystem } = vedtak.data;

        await statusPage.verifyValgtVedtak({ sakenGjelder, vedtaksdato, fagsystem, saksId, ytelse }, type);
      });
    },
  );
});
