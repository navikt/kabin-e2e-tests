import {
  DocumentSource,
  FristExtension,
  InngaaendeKanal,
  Part,
  PartType,
  Sakstype,
  type SelectJournalpostParams,
} from '@/fixtures/registrering/types';

export const SAKEN_GJELDER_KLAGE = new Part('SKEPTISK LANDSBY', '16036832758', PartType.SAKEN_GJELDER);
export const SAKEN_GJELDER_ANKE = new Part('SPESIFIKK KUBBESTOL', '29461964263', PartType.SAKEN_GJELDER);
export const SAKEN_GJELDER_OMGJØRINGSKRAV = new Part('SKEPTISK LANDSBY', '16036832758', PartType.SAKEN_GJELDER);
export const SAKEN_GJELDER_BEGJÆRING_OM_GJENOPPTAK = new Part(
  'SKEPTISK LANDSBY',
  '16036832758',
  PartType.SAKEN_GJELDER,
);

export const data = {
  ankendePart: new Part('FALSK ONKEL', '17887799784', PartType.KLAGER),
  fullmektig: new Part('FATTET ØRN MUSKEL', '14828897927', PartType.FULLMEKTIG),
  avsender: new Part('HUMORISTISK LOGG', '01046813711', PartType.AVSENDER),
  ekstraMottaker1: new Part('IVRIG JAK', '29480474455', PartType.EKSTRA_MOTTAKER),
  ekstraMottaker2: new Part('SANNSYNLIG MEDISIN', '06049939084', PartType.EKSTRA_MOTTAKER),
  ekstraMottaker3: new Part('DRIFTIG HVITKLØVER', '25046846764', PartType.EKSTRA_MOTTAKER),
  svarbrevName: 'E2E-dokumentnavn',
  svarbrevFullmektigNamae: 'E2E-fullmektig',
  sakenGjelderAddress1: 'E2E-adresselinje1',
  sakenGjelderAddress2: 'E2E-adresselinje2',
  sakenGjelderAddress3: 'E2E-adresselinje3',
  sakenGjelderLand: 'SØR-GEORGIA OG SØR-SANDWICHØYENE',
  ekstraMottakerAddress1: 'Ekstra mottakers E2E-adresselinje1',
  ekstraMottakerAddress2: 'Ekstra mottakers E2E-adresselinje2',
  ekstraMottakerAddress3: 'Ekstra mottakers E2E-adresselinje3',
  ekstraMottakerLand: 'HEARD- OG MCDONALD-ØYENE',
  fristInKabal: new FristExtension(68, 'måneder'),
  varsletFrist: new FristExtension(70, 'måneder'),
};

export const KLAGE: JournalpostTestdata = {
  type: Sakstype.KLAGE,
  source: DocumentSource.JOURNALPOST,
  sakenGjelder: SAKEN_GJELDER_KLAGE,
  getJournalpostParams: {
    fagsakId: '1814',
    title: 'Generelt brev',
    date: '23.08.2024',
    avsenderMottaker: 'SKEPTISK LANDSBY',
  },
  hjemlerLong: ['Folketrygdloven - § 8-2', 'Folketrygdloven - § 22-17'],
  hjemlerShort: ['Ftrl - § 8-2', 'Ftrl - § 22-17'],
  mottattKlageinstans: '23.08.2024',
  tildeltSaksbehandler: 'F_Z994864 E_Z994864',
  gosysOppgaveIndex: 0,
};

export const ANKE: JournalpostTestdata = {
  type: Sakstype.ANKE,
  source: DocumentSource.JOURNALPOST,
  sakenGjelder: SAKEN_GJELDER_ANKE,
  getJournalpostParams: {
    fagsakId: '712',
    title: 'Generelt brev',
    date: '23.08.2024',
    avsenderMottaker: 'SPESIFIKK KUBBESTOL',
  },
  hjemlerLong: ['Folketrygdloven - § 8-2', 'Folketrygdloven - § 22-17'],
  hjemlerShort: ['Ftrl - § 8-2', 'Ftrl - § 22-17'],
  mottattKlageinstans: '18.07.2024',
  tildeltSaksbehandler: 'F_Z994864 E_Z994864',
  gosysOppgaveIndex: 0,
};

export const OMGJØRINGSKRAV: JournalpostTestdata = {
  type: Sakstype.OMGJØRINGSKRAV,
  source: DocumentSource.JOURNALPOST,
  sakenGjelder: SAKEN_GJELDER_OMGJØRINGSKRAV,
  getJournalpostParams: {
    fagsakId: 'cde6',
    title: 'Ekspedisjonsbrev til Trygderetten',
    date: '23.04.2025',
    avsenderMottaker: 'TRYGDERETTEN',
  },
  hjemlerLong: ['Folketrygdloven - § 8-2', 'Folketrygdloven - § 22-17'],
  hjemlerShort: ['Ftrl - § 8-2', 'Ftrl - § 22-17'],
  mottattKlageinstans: '28.11.2024',
  tildeltSaksbehandler: 'F_Z994864 E_Z994864',
  gosysOppgaveIndex: 1,
};

export const BEGJÆRING_OM_GJENOPPTAK: JournalpostTestdata = {
  type: Sakstype.BEGJÆRING_OM_GJENOPPTAK,
  source: DocumentSource.JOURNALPOST,
  sakenGjelder: SAKEN_GJELDER_BEGJÆRING_OM_GJENOPPTAK,
  getJournalpostParams: {
    fagsakId: 'cde6',
    title: 'Ekspedisjonsbrev til Trygderetten',
    date: '23.04.2025',
    avsenderMottaker: 'TRYGDERETTEN',
  },
  hjemlerLong: ['Folketrygdloven - § 8-2', 'Folketrygdloven - § 22-17'],
  hjemlerShort: ['Ftrl - § 8-2', 'Ftrl - § 22-17'],
  mottattKlageinstans: '28.11.2024',
  tildeltSaksbehandler: 'F_Z994864 E_Z994864',
  gosysOppgaveIndex: 3,
};

/**
 * The upload variants reuse the person, hjemler and dates of their journalpost counterparts - the
 * only thing that differs is where the documents come from. They do need their own
 * `gosysOppgaveIndex`, since the tests run in parallel and no two registreringer can claim the same
 * Gosys-oppgave.
 */
export const ANKE_UPLOAD: UploadTestdata = {
  type: Sakstype.ANKE,
  source: DocumentSource.UPLOAD,
  sakenGjelder: SAKEN_GJELDER_ANKE,
  inngaaendeKanal: InngaaendeKanal.E_POST,
  hjemlerLong: ['Folketrygdloven - § 8-2', 'Folketrygdloven - § 22-17'],
  hjemlerShort: ['Ftrl - § 8-2', 'Ftrl - § 22-17'],
  mottattKlageinstans: '18.07.2024',
  tildeltSaksbehandler: 'F_Z994864 E_Z994864',
  gosysOppgaveIndex: 1,
};

export const OMGJØRINGSKRAV_UPLOAD: UploadTestdata = {
  type: Sakstype.OMGJØRINGSKRAV,
  source: DocumentSource.UPLOAD,
  sakenGjelder: SAKEN_GJELDER_OMGJØRINGSKRAV,
  inngaaendeKanal: InngaaendeKanal.ALTINN_INNBOKS,
  hjemlerLong: ['Folketrygdloven - § 8-2', 'Folketrygdloven - § 22-17'],
  hjemlerShort: ['Ftrl - § 8-2', 'Ftrl - § 22-17'],
  mottattKlageinstans: '28.11.2024',
  tildeltSaksbehandler: 'F_Z994864 E_Z994864',
  gosysOppgaveIndex: 2,
};

export const BEGJÆRING_OM_GJENOPPTAK_UPLOAD: UploadTestdata = {
  type: Sakstype.BEGJÆRING_OM_GJENOPPTAK,
  source: DocumentSource.UPLOAD,
  sakenGjelder: SAKEN_GJELDER_BEGJÆRING_OM_GJENOPPTAK,
  inngaaendeKanal: InngaaendeKanal.E_POST,
  hjemlerLong: ['Folketrygdloven - § 8-2', 'Folketrygdloven - § 22-17'],
  hjemlerShort: ['Ftrl - § 8-2', 'Ftrl - § 22-17'],
  mottattKlageinstans: '28.11.2024',
  tildeltSaksbehandler: 'F_Z994864 E_Z994864',
  gosysOppgaveIndex: 4,
};

/** Every registrering variant covered by `registrering.test.ts`, one test each. */
export const TESTDATA: Testdata[] = [
  KLAGE,
  ANKE,
  OMGJØRINGSKRAV,
  BEGJÆRING_OM_GJENOPPTAK,
  ANKE_UPLOAD,
  OMGJØRINGSKRAV_UPLOAD,
  BEGJÆRING_OM_GJENOPPTAK_UPLOAD,
];

interface CommonTestdata {
  sakenGjelder: Part;
  hjemlerLong: string[];
  hjemlerShort: string[];
  mottattKlageinstans: string;
  tildeltSaksbehandler: string;
  /**
   * Which of the selectable Gosys-oppgaver to claim, if Kabin asks for one at all. Whether it does
   * follows from the selected mulighet rather than from the sakstype, so the step simply skips when
   * the section is not rendered.
   *
   * Tests sharing a person must use different indices, since they run in parallel and no two
   * registreringer can claim the same oppgave.
   */
  gosysOppgaveIndex: number;
}

/** Registrering based on an existing journalpost. Available for every sakstype. */
interface JournalpostTestdata extends CommonTestdata {
  type: Sakstype;
  source: DocumentSource.JOURNALPOST;
  getJournalpostParams: SelectJournalpostParams;
}

/** Registrering based on uploaded documents. Available for every sakstype except klage - klager
 * always arrive as an existing journalpost. */
interface UploadTestdata extends CommonTestdata {
  type: Exclude<Sakstype, Sakstype.KLAGE>;
  source: DocumentSource.UPLOAD;
  inngaaendeKanal: InngaaendeKanal;
}

export type Testdata = JournalpostTestdata | UploadTestdata;
