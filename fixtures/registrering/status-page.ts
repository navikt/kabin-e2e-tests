import test, { expect, type Page } from '@playwright/test';
import { type Journalpost, JournalpostType, type Part, Sakstype } from '@/fixtures/registrering/types';

interface Saksinfo {
  mottattKlageinstans: string;
  fristInKabal: string;
  varsletFrist: string;
  klager: Part;
  fullmektig: Part;
  saksbehandlerName: string;
}

interface Svarbrevinfo {
  documentName: string;
  mottakere: { name: string; utskrift: string; address?: string }[];
}

interface ValgtVedtak {
  sakenGjelder: Part;
  vedtaksdato: string;
  ytelse: string | null;
  fagsystem: string;
  saksId: string;
}

const FRIST_REGEX = /Frist.*/;
const TEMA_REGEX = /Tema.*/;

export class StatusPage {
  constructor(public readonly page: Page) {}

  verifyJournalførtDocument = async (jp: Journalpost, type: Sakstype) =>
    test.step('Verifiser journalpost', async () => {
      const journalfoertDoc = this.page.getByRole('region', { name: REGION_NAME[type] });

      const kvitteringTemaContainer = journalfoertDoc.getByText(TEMA_REGEX).locator('> *');
      await kvitteringTemaContainer.filter({ hasNotText: 'Laster...' }).waitFor();

      await expect(journalfoertDoc.getByText('Tittel').locator('> *')).toHaveText(jp.title);
      await expect(journalfoertDoc.getByText(TEMA_REGEX).locator('> *')).toHaveText(jp.tema);
      await expect(journalfoertDoc.getByText('Dato').locator('> *')).toHaveText(jp.dato);
      await expect(journalfoertDoc.getByText('Avsender/mottaker').locator('> *')).toContainText(jp.avsenderMottaker);
      await expect(journalfoertDoc.getByText('Saks-ID').locator('> *')).toHaveText(jp.saksId);
      await expect(journalfoertDoc.getByText('Type').locator('> *')).toHaveText(JOURNALPOST_TYPE_NAME[jp.type]);

      for (const name of jp.logiskeVedleggNames) {
        await expect(journalfoertDoc.getByRole('list', { name: 'Logiske vedlegg', exact: true }).first()).toContainText(
          name,
        );
      }

      for (const name of jp.vedleggNames) {
        await expect(journalfoertDoc.getByTestId('status-journalpost-vedlegg-list').first()).toContainText(name);
      }
    });

  verifySaksinfo = async (info: Saksinfo, type: Sakstype) =>
    test.step('Verifiser saksinfo', async () => {
      const saksinfo = this.page.getByRole('region', { name: 'Saksinfo' });

      await expect(saksinfo.getByText('Mottatt NAV klageinstans').locator('> *')).toHaveText(info.mottattKlageinstans);
      await expect(saksinfo.getByText(FRIST_REGEX).locator('> *')).toHaveText(info.fristInKabal);
      await expect(saksinfo.getByText('Varslet frist').locator('> *')).toHaveText(info.varsletFrist);
      await expect(saksinfo.getByText(KLAGER_TEXT[type]).locator('> *')).toHaveText(info.klager.getNameAndId());
      await expect(saksinfo.getByText('Fullmektig').locator('> *')).toHaveText(info.fullmektig.getNameAndId());
      await expect(saksinfo.getByText('Tildelt saksbehandler').locator('> *')).toContainText(info.saksbehandlerName);
    });

  verifySvarbrevinfo = async (info: Svarbrevinfo) =>
    test.step('Verifiser svarbrevinfo', async () => {
      const svarbrevinfo = this.page.getByRole('region', { name: 'Svarbrevinfo' });

      await expect(svarbrevinfo.getByText('Dokumentnavn')).toContainText(info.documentName);

      const mottakere = svarbrevinfo.getByRole('region', { name: 'Mottakere' });

      for (const { name, utskrift, address } of info.mottakere) {
        await expect(mottakere.getByRole('listitem', { name })).toContainText(utskrift);

        if (typeof address === 'string') {
          await expect(mottakere.getByRole('listitem', { name })).toContainText(address);
        }
      }
    });

  verifyValgtVedtak = async (vedtak: ValgtVedtak, type: Sakstype) =>
    test.step('Verifiser valgt vedtak', async () => {
      const valgtVedtak = this.page.getByRole('region', { name: VEDTAK_REGION_NAME[type] });

      await expect(valgtVedtak.getByText('Saken gjelder').locator('> *')).toHaveText(
        vedtak.sakenGjelder.getNameAndId(),
      );
      await expect(valgtVedtak.getByText('Vedtaksdato').locator('> *')).toHaveText(vedtak.vedtaksdato);

      if (typeof vedtak.ytelse === 'string') {
        await expect(valgtVedtak.getByText('Ytelse').locator('> *')).toHaveText(vedtak.ytelse);
      }

      await expect(valgtVedtak.getByText('Fagsystem').locator('> *')).toHaveText(vedtak.fagsystem);
      await expect(valgtVedtak.getByText('Saks-ID').locator('> *')).toHaveText(vedtak.saksId);
    });
}

const REGION_NAME: Record<Sakstype, string> = {
  [Sakstype.ANKE]: 'Journalført anke',
  [Sakstype.KLAGE]: 'Valgt journalpost',
  [Sakstype.OMGJØRINGSKRAV]: 'Journalført omgjøringskrav',
};

const KLAGER_TEXT: Record<Sakstype, string> = {
  [Sakstype.ANKE]: 'Ankende part',
  [Sakstype.KLAGE]: 'Klager',
  [Sakstype.OMGJØRINGSKRAV]: 'Den som krever omgjøring',
};

const VEDTAK_REGION_NAME: Record<Sakstype, string> = {
  [Sakstype.ANKE]: 'Valgt ankevedtak',
  [Sakstype.KLAGE]: 'Valgt klagevedtak',
  [Sakstype.OMGJØRINGSKRAV]: 'Valgt vedtak',
};

const JOURNALPOST_TYPE_NAME: Record<JournalpostType, string> = {
  [JournalpostType.U]: 'Utgående',
  [JournalpostType.I]: 'Inngående',
  [JournalpostType.N]: 'Notat',
};
