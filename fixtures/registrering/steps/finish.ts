import test, { expect, type Page } from 'playwright/test';
import { STATUS_REGEX } from '@/fixtures/finished-request';
import { feilregistrerAndDelete } from '@/fixtures/kabal';
import { Sakstype } from '@/fixtures/registrering/types';

export const finish = async (page: Page, type: Sakstype) =>
  test.step('Fullfør', async () => {
    await page.getByText('Fullfør', { exact: true }).click();
    const requestPromise = page.waitForRequest('**/registreringer/**/ferdigstill');
    await page.getByText('Bekreft', { exact: true }).click();
    const request = await requestPromise;
    const response = await request.response();

    if (response === null) {
      throw new Error('No response');
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
