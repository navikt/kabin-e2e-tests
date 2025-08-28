import { type Page, test } from 'playwright/test';
import { finishedRequest } from '@/fixtures/finished-request';

const SOME_CHAR_REGEX = /.+/;

export const setHjemler = async (page: Page, longNames: string[], shortNames: string[]) =>
  test.step(`Sett hjemler: ${shortNames.join(', ')}`, async () => {
    await page.getByLabel('Hjemler').click();
    await page.getByText('Fjern alle').click();
    await page.locator('#hjemmelIdList').filter({ hasNotText: SOME_CHAR_REGEX }).waitFor();

    for (const longName of longNames) {
      const addHjemmelRequest = page.waitForRequest('**/hjemmel-id-list');
      await page.getByText(longName, { exact: true }).click();
      await finishedRequest(addHjemmelRequest, `Failed to add hjemmel "${longName}"`);
    }

    for (const shortName of shortNames) {
      await page.getByText(shortName, { exact: true }).click();
    }

    await page.getByLabel('Hjemler').click();
  });
