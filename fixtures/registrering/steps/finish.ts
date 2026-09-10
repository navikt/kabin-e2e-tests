import test, { expect, type Page } from '@playwright/test';
import { STATUS_REGEX } from '@/fixtures/finished-request';
import { feilregistrerAndDelete } from '@/fixtures/kabal';
import { Sakstype } from '@/fixtures/registrering/types';

export const finish = async (page: Page, type: Sakstype) =>
  test.step('Fullfør', async () => {
    await page.getByText('Fullfør', { exact: true }).click();

    const bekreft = page.getByText('Bekreft', { exact: true });
    await expect(bekreft).toBeVisible();

    const arenaCheckbox = page.getByRole('checkbox', { name: 'Jeg bekrefter at jeg har opprettet en anke i Arena' });

    if (await arenaCheckbox.isVisible()) {
      await test.step('Bekreft fullfør disabled før Arena bekreftet', async () => {
        await expect(bekreft).toBeDisabled();
      });

      await test.step('Bekreft opprettet i Arena', async () => {
        await arenaCheckbox.check();
        await expect(arenaCheckbox).toBeChecked();
      });
    }

    const requestPromise = page.waitForRequest('**/registreringer/**/ferdigstill');
    await bekreft.click();
    const request = await requestPromise;
    const response = await request.response();

    if (response === null) {
      throw new Error('Fullfør failed: No response');
    }

    if (!response.ok()) {
      throw new Error(`Fullfør failed: ${response.status()} - ${await response.text()}`);
    }

    await page.waitForURL(STATUS_REGEX);

    const res: unknown = await response.json();

    if (!isStatusResponse(res)) {
      throw new Error('Invalid response');
    }

    const cookies = await page.context().cookies();

    feilregistrerAndDelete(cookies, res.behandlingId);

    const main = page.getByRole('main');
    await expect(main).toContainText(FINISH_TEXT_MAP[type]);
  });

const isStatusResponse = (response: unknown): response is { behandlingId: string } =>
  typeof response === 'object' &&
  response !== null &&
  'behandlingId' in response &&
  typeof response.behandlingId === 'string';

const FINISH_TEXT_MAP: Record<Sakstype, string> = {
  [Sakstype.KLAGE]: 'Klage opprettet',
  [Sakstype.ANKE]: 'Anke opprettet',
  [Sakstype.OMGJØRINGSKRAV]: 'Omgjøringskrav opprettet',
};
