import { format } from 'date-fns';
import { test } from '@/fixtures/registrering/fixture';
import {
  DocumentSource,
  type Journalpost,
  JournalpostType,
  type Part,
  Sakstype,
  Utskriftstype,
} from '@/fixtures/registrering/types';
import { UI_DOMAIN } from '@/tests/functions';
import { data, TESTDATA } from '@/tests/registrering/testdata';

test.describe('Registrering', () => {
  test.beforeEach(({ page }) => page.goto(UI_DOMAIN));

  test.afterEach(async ({ registreringPage }, { status }) => {
    if (status !== 'passed') {
      await registreringPage.deleteRegistrering();
    }
  });

  for (const testdata of TESTDATA) {
    const {
      type,
      source,
      sakenGjelder,
      hjemlerLong,
      hjemlerShort,
      mottattKlageinstans,
      tildeltSaksbehandler,
      gosysOppgaveIndex,
    } = testdata;

    test(`${type} - ${source}`, async ({ registreringPage, statusPage }) => {
      await registreringPage.setSakenGjelder(sakenGjelder);

      // The registrering exists once the source of its documents can be picked.
      await registreringPage.verifySourceOptions();

      const dokumenter =
        source === DocumentSource.UPLOAD
          ? await registreringPage.uploadDokumenter(testdata.inngaaendeKanal)
          : await registreringPage.selectJournalpost(testdata.getJournalpostParams);

      await registreringPage.selectType(type);

      const vedtak = await registreringPage.selectFirstAvailableVedtak(type);

      const { fagsakId } = vedtak.data;

      await registreringPage.selectGosysOppgave(gosysOppgaveIndex);

      if (dokumenter.source === DocumentSource.JOURNALPOST) {
        await registreringPage.verifySaksId(dokumenter.journalpost.saksId, fagsakId);
      }

      const ytelse = await registreringPage.getYtelse();

      // A klage is only ever registered from a journalpost.
      if (type === Sakstype.KLAGE && dokumenter.source === DocumentSource.JOURNALPOST) {
        await registreringPage.setMottattVedtaksinstans(dokumenter.journalpost.dato);
      }

      await registreringPage.setMottattKlageinstans(mottattKlageinstans);

      await registreringPage.setFristInKabal(data.fristInKabal, mottattKlageinstans);
      await registreringPage.setHjemler(hjemlerLong, hjemlerShort);

      await registreringPage.verifySakenGjelder(sakenGjelder);
      await registreringPage.setAnkendePart(data.ankendePart);
      await registreringPage.setFullmektig(data.fullmektig);

      // Uploaded documents are always incoming, so avsender must always be set. For a journalpost it
      // only applies to inngående journalposter.
      if (dokumenter.source === DocumentSource.UPLOAD || dokumenter.journalpost.type === JournalpostType.I) {
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

      if (dokumenter.source === DocumentSource.UPLOAD) {
        // The documents that failed upload can never be journalført, so Kabin API refuses to finish
        // the registrering until they are gone.
        await registreringPage.verifyInvalidDokumenterBlockFinish(type);
        await registreringPage.deleteInvalidDokumenter();
      }

      await registreringPage.finish(type);

      if (dokumenter.source === DocumentSource.UPLOAD) {
        await statusPage.verifyUploadedDocuments(dokumenter.uploadedDocuments, type);
      } else {
        const { journalpost } = dokumenter;

        await statusPage.verifyJournalførtDocument(
          {
            title: journalpost.title,
            tema: vedtak.data.tema,
            dato: journalpost.saksId === fagsakId ? journalpost.dato : format(new Date(), 'dd.MM.yyyy'),
            avsenderMottaker: getAvsenderName(journalpost, data.avsender),
            saksId: fagsakId,
            type: journalpost.type,
            logiskeVedleggNames: journalpost.logiskeVedleggNames,
            vedleggNames: journalpost.vedleggNames,
          },
          type,
        );
      }

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
          { name: data.fullmektig.name, utskrift: 'Digital Postkasse Innbygger' },
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

/**
 * The avsender/mottaker the status page is expected to show for a journalpost. An inngående
 * journalpost shows the avsender set during registrering, an utgående one keeps the mottaker it was
 * journalført with, and a notat has neither.
 */
const getAvsenderName = (journalpost: Journalpost, avsender: Part): string => {
  switch (journalpost.type) {
    case JournalpostType.N:
      return 'Ingen';
    case JournalpostType.I:
      return avsender.getNameAndId();
    case JournalpostType.U:
      return journalpost.avsenderMottaker;
    default:
      throw new Error(`Unknown journalpostType: ${journalpost.type}`);
  }
};
