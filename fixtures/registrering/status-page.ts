import test, { Page, expect } from '@playwright/test';
import { Part, Sakstype, getJournalpostType } from './types';

interface Journalpost {
  title: string;
  tema: string;
  dato: string;
  avsenderMottaker: string;
  saksId: string;
  type: string;
  logiskeVedleggNames: string[];
  vedleggNames: string[];
}

interface Saksinfo {
  mottattKlageinstans: string;
  fristIKabal: string;
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

export class StatusPage {
  constructor(public readonly page: Page) {}

  #getJournaloertDocRegionName = (type: Sakstype) => {
    switch (type) {
      case Sakstype.ANKE:
        return 'Journalført anke';
      case Sakstype.KLAGE:
        return 'Valgt journalpost';
    }
  };

  verifyJournalførtDocument = async (jp: Journalpost, type: Sakstype) =>
    test.step('Verifiser journalpost', async () => {
      const journalfoertDoc = this.page.getByRole('region', { name: this.#getJournaloertDocRegionName(type) });

      const kvitteringTemaContainer = journalfoertDoc.getByText('Tema').locator('> *');
      await kvitteringTemaContainer.filter({ hasNotText: 'Laster...' }).waitFor();

      await expect(journalfoertDoc.getByText('Tittel').locator('> *')).toHaveText(jp.title);
      await expect(journalfoertDoc.getByText('Tema').locator('> *')).toHaveText(jp.tema);
      await expect(journalfoertDoc.getByText('Dato').locator('> *')).toHaveText(jp.dato);
      await expect(journalfoertDoc.getByText('Avsender/mottaker').locator('> *')).toContainText(jp.avsenderMottaker);
      await expect(journalfoertDoc.getByText('Saks-ID').locator('> *')).toHaveText(jp.saksId);
      await expect(journalfoertDoc.getByText('Type').locator('> *')).toHaveText(getJournalpostType(jp.type));

      for (const name of jp.logiskeVedleggNames) {
        await expect(journalfoertDoc.getByRole('list', { name: 'Logiske vedlegg', exact: true }).first()).toContainText(
          name,
        );
      }

      for (const name of jp.vedleggNames) {
        await expect(journalfoertDoc.getByTestId('status-journalpost-vedlegg-list').first()).toContainText(name);
      }
    });

  #getKlagerText = (type: Sakstype) => {
    switch (type) {
      case Sakstype.ANKE:
        return 'Ankende part';
      case Sakstype.KLAGE:
        return 'Klager';
    }
  };

  verifySaksinfo = async (info: Saksinfo, type: Sakstype) =>
    test.step('Verifiser saksinfo', async () => {
      const saksinfo = this.page.getByRole('region', { name: 'Saksinfo' });

      await expect(saksinfo.getByText('Mottatt NAV klageinstans').locator('> *')).toHaveText(info.mottattKlageinstans);
      await expect(saksinfo.getByText(/Frist.*/).locator('> *')).toHaveText(info.fristIKabal);
      await expect(saksinfo.getByText('Varslet frist').locator('> *')).toHaveText(info.varsletFrist);
      await expect(saksinfo.getByText(this.#getKlagerText(type)).locator('> *')).toHaveText(info.klager.getNameAndId());
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

  #getValgtVedtakRegionName = (type: Sakstype) => {
    switch (type) {
      case Sakstype.ANKE:
        return 'Valgt vedtak';
      case Sakstype.KLAGE:
        return 'Valgt klagevedtak';
    }
  };

  verifyValgtVedtak = async (vedtak: ValgtVedtak, type: Sakstype) =>
    test.step('Verifiser valgt vedtak', async () => {
      const valgtVedtak = this.page.getByRole('region', { name: this.#getValgtVedtakRegionName(type) });

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
