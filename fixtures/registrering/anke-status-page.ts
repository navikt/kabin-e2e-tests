import test, { Page, expect } from '@playwright/test';
import { Part, getJournalpostType } from './types';

interface Journalpost {
  title: string;
  tema: string;
  dato: string;
  avsenderMottaker: Part;
  saksId: string;
  type: string;
  logiskeVedleggNames: string[];
  vedleggNames: string[];
}

interface Saksinfo {
  mottattKlageinstans: string;
  fristIKabal: string;
  varsletFrist: string;
  ankendePart: Part;
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
  ytelse: string;
  fagsystem: string;
  saksId: string;
}

export class AnkeStatusPage {
  constructor(public readonly page: Page) {}

  verifyJournalførtAnke = async (jp: Journalpost) =>
    test.step('Verifiser journalpost', async () => {
      const journalfoertAnke = this.page.getByRole('region', { name: 'Journalført anke' });

      const kvitteringTemaContainer = journalfoertAnke.getByText('Tema').locator('> *');
      await kvitteringTemaContainer.filter({ hasNotText: 'Laster...' }).waitFor();

      await expect(journalfoertAnke.getByText('Tittel').locator('> *')).toHaveText(jp.title);
      await expect(journalfoertAnke.getByText('Tema').locator('> *')).toHaveText(jp.tema);
      await expect(journalfoertAnke.getByText('Dato').locator('> *')).toHaveText(jp.dato);
      await expect(journalfoertAnke.getByText('Avsender/mottaker').locator('> *')).toHaveText(
        jp.avsenderMottaker.getNameAndId(),
      );
      await expect(journalfoertAnke.getByText('Saks-ID').locator('> *')).toHaveText(jp.saksId);
      await expect(journalfoertAnke.getByText('Type').locator('> *')).toHaveText(getJournalpostType(jp.type));

      for (const name of jp.logiskeVedleggNames) {
        await expect(
          journalfoertAnke.getByRole('list', { name: 'Logiske vedlegg', exact: true }).first(),
        ).toContainText(name);
      }

      for (const name of jp.vedleggNames) {
        await expect(journalfoertAnke.getByTestId('status-journalpost-vedlegg-list').first()).toContainText(name);
      }
    });

  verifySaksinfo = async (info: Saksinfo) =>
    test.step('Verifiser saksinfo', async () => {
      const saksinfo = this.page.getByRole('region', { name: 'Saksinfo' });

      await expect(saksinfo.getByText('Mottatt NAV klageinstans').locator('> *')).toHaveText(info.mottattKlageinstans);
      await expect(saksinfo.getByText(/Frist.*/).locator('> *')).toHaveText(info.fristIKabal);
      await expect(saksinfo.getByText('Varslet frist').locator('> *')).toHaveText(info.varsletFrist);
      await expect(saksinfo.getByText('Ankende part').locator('> *')).toHaveText(info.ankendePart.getNameAndId());
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

  verifyValgtVedtak = async (vedtak: ValgtVedtak) =>
    test.step('Verifiser valgt vedtak', async () => {
      const valgtVedtak = this.page.getByRole('region', { name: 'Valgt vedtak' });

      await expect(valgtVedtak.getByText('Saken gjelder').locator('> *')).toHaveText(
        vedtak.sakenGjelder.getNameAndId(),
      );
      await expect(valgtVedtak.getByText('Vedtaksdato').locator('> *')).toHaveText(vedtak.vedtaksdato);
      await expect(valgtVedtak.getByText('Ytelse').locator('> *')).toHaveText(vedtak.ytelse);
      await expect(valgtVedtak.getByText('Fagsystem').locator('> *')).toHaveText(vedtak.fagsystem);
      await expect(valgtVedtak.getByText('Saks-ID').locator('> *')).toHaveText(vedtak.saksId);
    });
}
