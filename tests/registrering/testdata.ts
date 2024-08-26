import { FristExtension, Part, PartType, Sakstype } from '../../fixtures/registrering/types';

const SAKEN_GJELDER_ANKE = new Part('SPESIFIKK KUBBESTOL', '29461964263', PartType.SAKEN_GJELDER);
const SAKEN_GJELDER_KLAGE = new Part('SKEPTISK LANDSBY', '16036832758', PartType.SAKEN_GJELDER);

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
  fristIKabal: new FristExtension(68, 'måneder'),
  varsletFrist: new FristExtension(70, 'måneder'),
};

export const ANKE = {
  type: Sakstype.ANKE,
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
  tildeltSaksbehandler: 'F_Z994488 E_Z994488',
};

export const KLAGE = {
  type: Sakstype.KLAGE,
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
};
