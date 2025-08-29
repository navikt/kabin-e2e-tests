import test, { type Page } from 'playwright/test';

export const setMottattVedtaksinstans = async (page: Page, vedtaksdato: string) =>
  test.step(`Sett Mottatt vedtaksinstans: ${vedtaksdato}`, async () => {
    await page.waitForTimeout(1000);
    await page.getByLabel('Mottatt vedtaksinstans').fill(vedtaksdato);
  });
