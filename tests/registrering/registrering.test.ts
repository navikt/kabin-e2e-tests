import { format } from 'date-fns';
import { finishedRequest } from '@/fixtures/finished-request';
import { test } from '@/fixtures/registrering/fixture';
import { type Part, Sakstype, Utskriftstype } from '@/fixtures/registrering/types';
import { UI_DOMAIN } from '@/tests/functions';
import { ANKE, data, KLAGE, OMGJØRINGSKRAV } from '@/tests/registrering/testdata';

test.describe('Registrering', () => {
  test.beforeEach(({ page }) => page.goto(UI_DOMAIN));

  test.afterEach(async ({ registreringPage }, { status }) => {
    if (status !== 'passed') {
      await registreringPage.deleteRegistrering();
    }
  });

  for (const {
    type,
    sakenGjelder,
    getJournalpostParams,
    hjemlerLong,
    hjemlerShort,
    mottattKlageinstans,
    tildeltSaksbehandler,
    gosysOppgaveIndex,
  } of [KLAGE, ANKE, OMGJØRINGSKRAV]) {
    test(`${type}`, async ({ registreringPage, statusPage, page }) => {
      const fetchingJournalposter = page.waitForRequest('**/arkivertedokumenter'); // The request monitoring must be created before the request is made.
      const createRegistrering = page.waitForRequest(`${UI_DOMAIN}/api/kabin-api/registreringer`);
      await registreringPage.setSakenGjelder(sakenGjelder); // Will trigger the request for journalposter.

      await finishedRequest(createRegistrering, 'Failed to create registrering');

      await finishedRequest(fetchingJournalposter, 'Failed to fetch journalposter');

      const journalpost = await registreringPage.selectJournalpostByInnerText(getJournalpostParams);
      await registreringPage.selectType(type);

      const vedtak = await registreringPage.selectFirstAvailableVedtak(type);

      const { fagsakId } = vedtak.data;

      await registreringPage.selectGosysOppgave(gosysOppgaveIndex);

      await registreringPage.verifySaksId(journalpost.saksId, fagsakId);

      const ytelse = await registreringPage.getYtelse();

      if (type === Sakstype.KLAGE) {
        await registreringPage.setMottattVedtaksinstans(journalpost.dato);
      }

      await registreringPage.setMottattKlageinstans(mottattKlageinstans);

      await registreringPage.setFristInKabal(data.fristInKabal, mottattKlageinstans);
      await registreringPage.setHjemler(hjemlerLong, hjemlerShort);

      await registreringPage.verifySakenGjelder(sakenGjelder);
      await registreringPage.setAnkendePart(data.ankendePart);
      await registreringPage.setFullmektig(data.fullmektig);

      if (journalpost.type === 'I') {
        await registreringPage.setAvsender(data.avsender);
      }

      await registreringPage.setSaksbehandler(tildeltSaksbehandler);

      await registreringPage.setSendSvarbrev(true);
      await registreringPage.setSvarbrevDocumentName(data.svarbrevName);
      await registreringPage.setSvarbrevFullmektigName(data.svarbrevFullmektigNamae);
      await registreringPage.setSvarbrevVarsletFrist(data.varsletFrist);
      await registreringPage.setSvarbrevInitialFritekst('Valgfri E2E-fritekst');
      await registreringPage.setSvarbrevFritekst('E2E-fritekst');

      await registreringPage.selectMottaker(sakenGjelder, type);
      await registreringPage.selectMottaker(data.ankendePart, type);
      await registreringPage.selectMottaker(data.fullmektig, type);

      await registreringPage.setUtskriftTypeForPart(data.ankendePart, Utskriftstype.LOKAL);

      await registreringPage.changeAddressForPart(
        sakenGjelder,
        data.sakenGjelderAddress1,
        data.sakenGjelderAddress2,
        data.sakenGjelderAddress3,
        { search: 'sandwich', fullName: data.sakenGjelderLand },
      );

      await registreringPage.addExtraReceiver(data.ekstraMottaker1);
      await registreringPage.addExtraReceiver(data.ekstraMottaker2);
      await registreringPage.addExtraReceiver(data.ekstraMottaker3);
      await registreringPage.setUtskriftTypeForExtraReceiver(data.ekstraMottaker1, Utskriftstype.LOKAL);
      await registreringPage.changeAddressForExtraReceiver(
        data.ekstraMottaker2,
        data.ekstraMottakerAddress1,
        data.ekstraMottakerAddress2,
        data.ekstraMottakerAddress3,
        { search: 'mcdonald', fullName: data.ekstraMottakerLand },
      );

      await registreringPage.finish(type);

      await statusPage.verifyJournalførtDocument(
        {
          title: journalpost.title,
          tema: vedtak.data.tema,
          dato: journalpost.saksId === fagsakId ? journalpost.dato : format(new Date(), 'dd.MM.yyyy'),
          avsenderMottaker: getAvsenderName(journalpost.type, journalpost.avsenderMottaker, data.avsender),
          saksId: fagsakId,
          type: journalpost.type,
          logiskeVedleggNames: journalpost.logiskeVedleggNames,
          vedleggNames: journalpost.vedleggNames,
        },
        type,
      );

      await statusPage.verifySaksinfo(
        {
          mottattKlageinstans,
          fristInKabal: data.fristInKabal.getDateAndExtension(mottattKlageinstans),
          varsletFrist: data.varsletFrist.getDateAndExtension(mottattKlageinstans),
          klager: data.ankendePart,
          fullmektig: data.fullmektig,
          saksbehandlerName: tildeltSaksbehandler,
        },
        type,
      );

      const sakenGjelderAddress = `${data.sakenGjelderAddress1}, ${data.sakenGjelderAddress2}, ${data.sakenGjelderAddress3}, ${data.sakenGjelderLand}`;
      const extraMottakerAddress = `${data.ekstraMottakerAddress1}, ${data.ekstraMottakerAddress2}, ${data.ekstraMottakerAddress3}, ${data.ekstraMottakerLand}`;
      await statusPage.verifySvarbrevinfo({
        documentName: data.svarbrevName,
        mottakere: [
          { name: sakenGjelder.name, utskrift: 'Sentral utskrift', address: sakenGjelderAddress },
          { name: data.ankendePart.name, utskrift: 'Lokal utskrift' },
          { name: data.fullmektig.name, utskrift: 'Sentral utskrift' },
          { name: data.ekstraMottaker1.name, utskrift: 'Lokal utskrift' },
          { name: data.ekstraMottaker2.name, utskrift: 'Sentral utskrift', address: extraMottakerAddress },
          { name: data.ekstraMottaker3.name, utskrift: 'Sentral utskrift' },
        ],
      });

      const { vedtaksdato, fagsystem } = vedtak.data;

      await statusPage.verifyValgtVedtak({ sakenGjelder, vedtaksdato, fagsystem, saksId: fagsakId, ytelse }, type);
    });
  }
});

const getAvsenderName = (journalpostType: string, journalpostAvsenderMottaker: string, testDataAvsender: Part) => {
  switch (journalpostType) {
    case 'N':
      return 'Ingen';
    case 'I':
      return testDataAvsender.getNameAndId();
    case 'U':
      return journalpostAvsenderMottaker;
    default:
      throw new Error(`Unknown journalpostType: ${journalpostType}`);
  }
};
