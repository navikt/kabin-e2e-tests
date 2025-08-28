import test, { expect, type Page } from 'playwright/test';
import { finishedRequest } from '@/fixtures/finished-request';

export const setMottattKlageinstans = async (page: Page, vedtaksdato: string) =>
  test.step(`Sett Mottatt Klageinstans: ${vedtaksdato}`, async () => {
    await page.getByRole('textbox', { name: 'Mottatt Klageinstans' }).clear();

    await page.waitForTimeout(500);

    const setMottattKlageinstansReq = page.waitForRequest('**/registreringer/**/overstyringer/mottatt-klageinstans');
    await page.getByLabel('Mottatt Klageinstans').fill(vedtaksdato);
    await page.keyboard.press('Tab');
    await finishedRequest(setMottattKlageinstansReq, `Failed to set mottatt klageinstans to "${vedtaksdato}"`);

    const value = page.getByRole('textbox', { name: 'Mottatt Klageinstans' });
    await expect(value).toHaveAttribute('value', vedtaksdato);
  });
