import { addMonths, addWeeks, format, parse } from 'date-fns';

export enum JournalpostType {
  U = 'U',
  I = 'I',
  N = 'N',
}

const JOURNALPOST_TYPES = Object.values(JournalpostType);

export const isJournalpostType = (type: string): type is JournalpostType =>
  JOURNALPOST_TYPES.includes(type as JournalpostType);

export interface Journalpost {
  title: string;
  tema: string;
  dato: string;
  avsenderMottaker: string;
  saksId: string;
  type: JournalpostType;
  logiskeVedleggNames: string[];
  vedleggNames: string[];
}

export enum PartType {
  SAKEN_GJELDER = 'Saken gjelder',
  FULLMEKTIG = 'Fullmektig',
  KLAGER = 'Klager',
  AVSENDER = 'Avsender',
  EKSTRA_MOTTAKER = 'Ekstra mottaker',
}

export enum Utskriftstype {
  SENTRAL = 'Sentral utskrift',
  LOKAL = 'Lokal utskrift',
}

const SIX_CIPHERS_REGEX = /(.{6})/;

export class Part {
  constructor(
    public name: string,
    public id: string,
    public type: PartType,
  ) {}

  public getHumanReadableId(): string {
    return this.id.replace(SIX_CIPHERS_REGEX, '$1 ');
  }

  // Concatenated name and id, used to match with textContent()
  // Example: SPESIFIKK KUBBESTOL294619 64263
  public getNameAndId(): string {
    return `${this.name}${this.getHumanReadableId()}`;
  }

  public getTestLabelWithType(): string {
    if (this.type === PartType.EKSTRA_MOTTAKER) {
      return this.name;
    }

    return `${this.name} - ${this.type}`;
  }
}

export class FristExtension {
  constructor(
    public value: number,
    public unit: 'uker' | 'måneder',
  ) {}

  getExtendedDate(date: string): string {
    const parsed = parse(date, 'dd.MM.yyyy', new Date());

    if (this.unit === 'uker') {
      return format(addWeeks(parsed, this.value), 'dd.MM.yyyy');
    }

    return format(addMonths(parsed, this.value), 'dd.MM.yyyy');
  }

  getDateAndExtension(date: string): string {
    return `${this.getExtendedDate(date)}${this.value} ${this.unit}`;
  }

  getTestLabel(from = format(new Date(), 'dd.MM.yyyy')): string {
    return `${from} + ${this.value} ${this.unit} = ${this.getExtendedDate(from)}`;
  }
}

export interface Country {
  search: string;
  fullName: string;
}

export enum Sakstype {
  KLAGE = 'KLAGE',
  ANKE = 'ANKE',
  OMGJØRINGSKRAV = 'OMGJØRINGSKRAV',
}

export interface Ankevedtak {
  type: string;
  fagsakId: string;
  tema: string;
  ytelse: string;
  vedtaksdato: string;
  fagsystem: string;
}

export interface Omgjøringskravvedtak extends Ankevedtak {}

export interface Klagevedtak {
  fagsakId: string;
  tema: string;
  vedtaksdato: string;
  behandlendeEnhet: string;
  fagsystem: string;
}

export type Vedtak =
  | { type: Sakstype.KLAGE; data: Klagevedtak }
  | { type: Sakstype.ANKE; data: Ankevedtak }
  | { type: Sakstype.OMGJØRINGSKRAV; data: Omgjøringskravvedtak };

export interface SelectJournalpostParams {
  title?: string;
  tema?: string;
  date?: string;
  avsenderMottaker?: string;
  fagsakId?: string;
  type?: JournalpostType;
}

export interface Ankemulighet {
  type: string;
  fagsakId: string;
  tema: string;
  ytelse: string;
  vedtaksdato: string;
  fagsystem: string;
}

export interface Klagemulighet {
  fagsakId: string;
  tema: string;
  vedtakInnstilling: string;
  behandlendeEnhet: string;
  fagsystem: string;
}
