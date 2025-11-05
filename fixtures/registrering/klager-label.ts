import { Sakstype } from '@/fixtures/registrering/types';

export const KLAGER_LABEL: Record<Sakstype, string> = {
  [Sakstype.ANKE]: 'Ankende part',
  [Sakstype.KLAGE]: 'Klager',
  [Sakstype.OMGJØRINGSKRAV]: 'Den som krever omgjøring',
};
