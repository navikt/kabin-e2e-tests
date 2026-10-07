import type { KlankeMulighet } from '@/fixtures/klanke';
import type { MulighetFilter } from '@/fixtures/registrering/steps/select-vedtak';
import {
  DocumentSource,
  FristExtension,
  InngaaendeKanal,
  Part,
  PartType,
  Sakstype,
  type SelectJournalpostParams,
} from '@/fixtures/registrering/types';

export const SAKEN_GJELDER_KLAGE = new Part('FLYKTIG TANKE', '26477435792', PartType.SAKEN_GJELDER);
export const SAKEN_GJELDER_ANKE = new Part('FLYKTIG TANKE', '26477435792', PartType.SAKEN_GJELDER);
export const SAKEN_GJELDER_OMGJØRINGSKRAV = new Part('FLYKTIG TANKE', '26477435792', PartType.SAKEN_GJELDER);
export const SAKEN_GJELDER_BEGJÆRING_OM_GJENOPPTAK = new Part('FLYKTIG TANKE', '26477435792', PartType.SAKEN_GJELDER);

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
    fagsakId: 'cde10',
    title: 'Klage',
    date: '11.09.2026',
    avsenderMottaker: 'FLYKTIG TANKE',
  },
  // Sent in via nav.no.
  canChangeAvsender: false,
  // On the same fagsak as the journalpost, so it is not journalført on another sak. Its vedtaksdato is
  // before the journalpost date, and tells it apart from other muligheter on the fagsak.
  klankeMulighet: { sakstype: 'KLAGE', fagsakId: 'cde10', temaId: 'SYK', vedtaksdato: '09.09.2026' },
  tema: 'Sykepenger',
  hjemlerLong: ['Folketrygdloven - § 8-2', 'Folketrygdloven - § 22-17'],
  hjemlerShort: ['Ftrl - § 8-2', 'Ftrl - § 22-17'],
  mottattKlageinstans: '11.09.2026',
  tildeltSaksbehandler: 'F_Z994864 E_Z994864',
  gosysOppgaveIndex: 0,
};

export const ANKE: JournalpostTestdata = {
  type: Sakstype.ANKE,
  source: DocumentSource.JOURNALPOST,
  sakenGjelder: SAKEN_GJELDER_ANKE,
  getJournalpostParams: {
    fagsakId: 'cde10',
    title: 'Klagevedtak',
    date: '11.09.2026',
    avsenderMottaker: 'FLYKTIG TANKE',
  },
  canChangeAvsender: false,
  // On the same fagsak as the journalpost, so it is not journalført on another sak.
  klankeMulighet: { sakstype: 'ANKE', fagsakId: 'cde10', temaId: 'SYK', vedtaksdato: '08.09.2026' },
  tema: 'Sykepenger',
  hjemlerLong: ['Folketrygdloven - § 8-2', 'Folketrygdloven - § 22-17'],
  hjemlerShort: ['Ftrl - § 8-2', 'Ftrl - § 22-17'],
  mottattKlageinstans: '11.09.2026',
  tildeltSaksbehandler: 'F_Z994864 E_Z994864',
  gosysOppgaveIndex: 1,
};

/**
 * Finished Kabal behandling for FLYKTIG TANKE on Infotrygd sak cde10. Omgjøringskravmuligheter are not used up,
 * so both omgjøringskrav tests select it.
 */
const OMGJØRINGSKRAVMULIGHET: MulighetFilter = { fagsakId: 'cde10', fagsystem: 'Infotrygd', date: '11.09.2026' };

export const OMGJØRINGSKRAV: JournalpostTestdata = {
  type: Sakstype.OMGJØRINGSKRAV,
  source: DocumentSource.JOURNALPOST,
  sakenGjelder: SAKEN_GJELDER_OMGJØRINGSKRAV,
  getJournalpostParams: {
    fagsakId: 'cde10',
    title: 'Klagevedtak',
    date: '11.09.2026',
    avsenderMottaker: 'FLYKTIG TANKE',
  },
  canChangeAvsender: false,
  tema: 'Sykepenger',
  kabalMulighet: OMGJØRINGSKRAVMULIGHET,
  hjemlerLong: ['Folketrygdloven - § 8-2', 'Folketrygdloven - § 22-17'],
  hjemlerShort: ['Ftrl - § 8-2', 'Ftrl - § 22-17'],
  mottattKlageinstans: '11.09.2026',
  tildeltSaksbehandler: 'F_Z994864 E_Z994864',
  gosysOppgaveIndex: 2,
};

/**
 * Finished Anke i Trygderetten in Kabal (behandling ded83fc8-a80f-421d-a86c-12815e3df6c9), created with
 * kabal-api's /mockdata/randomankeitrygderetten and finished by hand. Gjenopptaksmuligheter are not used
 * up, so both gjenopptak tests select it.
 */
const GJENOPPTAKSMULIGHET: MulighetFilter = { fagsakId: 'cde10', fagsystem: 'Infotrygd', date: '01.10.2026' };

export const BEGJÆRING_OM_GJENOPPTAK: JournalpostTestdata = {
  type: Sakstype.BEGJÆRING_OM_GJENOPPTAK,
  source: DocumentSource.JOURNALPOST,
  sakenGjelder: SAKEN_GJELDER_BEGJÆRING_OM_GJENOPPTAK,
  // Kabin requires the journalpost to be dated no earlier than the kjennelse of the mulighet.
  getJournalpostParams: {
    fagsakId: 'cde12',
    title: 'Ekspedisjonsbrev til Trygderetten',
    date: '06.10.2026',
    avsenderMottaker: 'TRYGDERETTEN',
  },
  canChangeAvsender: false,
  tema: 'Sykepenger',
  kabalMulighet: GJENOPPTAKSMULIGHET,
  hjemlerLong: ['Folketrygdloven - § 8-2', 'Folketrygdloven - § 22-17'],
  hjemlerShort: ['Ftrl - § 8-2', 'Ftrl - § 22-17'],
  // Between the kjennelse of the mulighet and the journalpost date.
  mottattKlageinstans: '02.10.2026',
  tildeltSaksbehandler: 'F_Z994864 E_Z994864',
};

/**
 * The upload variants reuse the person and hjemler of their journalpost counterparts. Without a
 * journalpost date, vedtak with later vedtaksdato are selectable, so `mottattKlageinstans` must be
 * later as well. Where a Gosys-oppgave is required, they also need their own `gosysOppgaveIndex`, since
 * the tests run in parallel and no two registreringer can claim the same Gosys-oppgave.
 */
export const ANKE_UPLOAD: UploadTestdata = {
  type: Sakstype.ANKE,
  source: DocumentSource.UPLOAD,
  sakenGjelder: SAKEN_GJELDER_ANKE,
  inngaaendeKanal: InngaaendeKanal.E_POST,
  // Ankemuligheter are only told apart by fagsakId, so it must differ from the one of `ANKE`.
  klankeMulighet: { sakstype: 'ANKE', fagsakId: 'cde13', temaId: 'SYK', vedtaksdato: '08.09.2026' },
  tema: 'Sykepenger',
  hjemlerLong: ['Folketrygdloven - § 8-2', 'Folketrygdloven - § 22-17'],
  hjemlerShort: ['Ftrl - § 8-2', 'Ftrl - § 22-17'],
  mottattKlageinstans: '28.09.2026',
  tildeltSaksbehandler: 'F_Z994864 E_Z994864',
  gosysOppgaveIndex: 3,
};

export const OMGJØRINGSKRAV_UPLOAD: UploadTestdata = {
  type: Sakstype.OMGJØRINGSKRAV,
  source: DocumentSource.UPLOAD,
  sakenGjelder: SAKEN_GJELDER_OMGJØRINGSKRAV,
  inngaaendeKanal: InngaaendeKanal.ALTINN_INNBOKS,
  tema: 'Sykepenger',
  kabalMulighet: OMGJØRINGSKRAVMULIGHET,
  hjemlerLong: ['Folketrygdloven - § 8-2', 'Folketrygdloven - § 22-17'],
  hjemlerShort: ['Ftrl - § 8-2', 'Ftrl - § 22-17'],
  mottattKlageinstans: '28.09.2026',
  tildeltSaksbehandler: 'F_Z994864 E_Z994864',
  gosysOppgaveIndex: 4,
};

export const BEGJÆRING_OM_GJENOPPTAK_UPLOAD: UploadTestdata = {
  type: Sakstype.BEGJÆRING_OM_GJENOPPTAK,
  source: DocumentSource.UPLOAD,
  sakenGjelder: SAKEN_GJELDER_BEGJÆRING_OM_GJENOPPTAK,
  inngaaendeKanal: InngaaendeKanal.E_POST,
  tema: 'Sykepenger',
  kabalMulighet: GJENOPPTAKSMULIGHET,
  hjemlerLong: ['Folketrygdloven - § 8-2', 'Folketrygdloven - § 22-17'],
  hjemlerShort: ['Ftrl - § 8-2', 'Ftrl - § 22-17'],
  mottattKlageinstans: '02.10.2026',
  tildeltSaksbehandler: 'F_Z994864 E_Z994864',
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
  /** Tema of the vedtak to select. Decides which hjemler are available. */
  tema: string;
  hjemlerLong: string[];
  hjemlerShort: string[];
  /**
   * For a klage it must be between the journalpost date and today. For the other sakstyper it must be
   * between the vedtaksdato and the journalpost date - or today, for uploaded documents.
   */
  mottattKlageinstans: string;
  tildeltSaksbehandler: string;
  /**
   * Which of the selectable Gosys-oppgaver to claim. Tests sharing a saken gjelder must use different
   * indices, since they run in parallel and no two registreringer can claim the same oppgave. Omitted
   * when the mulighet does not require one - Infotrygd muligheter always do, Kabal muligheter may not.
   */
  gosysOppgaveIndex?: number;
  /**
   * Infotrygd mulighet to create in Klanke and select. A mulighet is used up once a Kabal behandling is
   * created from it, so every test creates its own. Tests sharing a saken gjelder must create
   * muligheter Kabin shows differently, since they run in parallel.
   */
  klankeMulighet?: KlankeMulighet;
  /**
   * Finished Kabal behandling to select. Unlike Klanke muligheter, these are prepared by hand and not
   * used up, so tests can share one.
   */
  kabalMulighet?: MulighetFilter;
}

/** Registrering based on an existing journalpost. Available for every sakstype. */
interface JournalpostTestdata extends CommonTestdata {
  type: Sakstype;
  source: DocumentSource.JOURNALPOST;
  getJournalpostParams: SelectJournalpostParams;
  /**
   * Whether Kabin lets the avsender of the journalpost be changed. Only inngående journalposter have
   * one, and Kabin keeps it if the journalpost was sent in digitally or is older than a year.
   */
  canChangeAvsender: boolean;
}

/** Registrering based on uploaded documents. Available for every sakstype except klage - klager
 * always arrive as an existing journalpost. */
interface UploadTestdata extends CommonTestdata {
  type: Exclude<Sakstype, Sakstype.KLAGE>;
  source: DocumentSource.UPLOAD;
  inngaaendeKanal: InngaaendeKanal;
}

export type Testdata = JournalpostTestdata | UploadTestdata;
