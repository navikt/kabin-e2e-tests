import test, { type Page, expect } from '@playwright/test';

export class KlagePage {
  constructor(public readonly page: Page) {}

  setMottattVedtaksinstans = async (vedtaksdato: string) =>
    test.step(`Sett Mottatt vedtaksinstans: ${vedtaksdato}`, async () => {
      await this.page.waitForTimeout(1000);
      await this.page.getByLabel('Mottatt vedtaksinstans').fill(vedtaksdato);
    });

  setFirstAvailableGosysOppgave = async () =>
    test.step('Sett første tilgjengelige Gosys-oppgave', async () => {
      const row = this.page.getByRole('table', { name: 'Gosys-oppgaver' }).locator('tbody > tr').first();
      const oppgave = row.filter({ has: this.page.getByText('Velg') });

      await oppgave.waitFor();

      const cells = oppgave.locator('td');

      const [, opprettet, first, tema, gjelder, oppgavetype, tildeltEnhetsnr, opprettetAvEnhetsnr] =
        await cells.allInnerTexts();

      await oppgave.getByText('Velg').click();

      const button = row.getByRole('button').last();

      await expect(button).toHaveAttribute('title', 'Valgt');

      return { opprettet, first, tema, gjelder, oppgavetype, tildeltEnhetsnr, opprettetAvEnhetsnr };
    });

  selectKlage = async () =>
    test.step('Velg type: klage', async () => {
      await this.page.getByRole('radio', { name: 'Klage', exact: true }).click();

      return this.page.getByText('Velg vedtaket klagen gjelder');
    });
}
