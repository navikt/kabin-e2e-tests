import test, { expect, type Page } from 'playwright/test';
import { finishedRequest } from '@/fixtures/finished-request';
import type { FristExtension } from '@/fixtures/registrering/types';

export const setFristInKabal = async (page: Page, frist: FristExtension, vedtaksdato: string) =>
  test.step(`Sett frist i Kabal: ${frist.getTestLabel(vedtaksdato)}`, async () => {
    const fristSection = page.getByRole('region', { name: 'Frist i Kabal' });
    await fristSection.waitFor();

    const setUnitCountRequest = page.waitForRequest('**/registreringer/**/overstyringer/behandlingstid');
    await fristSection.locator('input').fill(frist.value.toString());
    await finishedRequest(setUnitCountRequest, `Failed to set unit count to "${frist.value}"`);

    const setUnitTypeRequest = page.waitForRequest('**/registreringer/**/overstyringer/behandlingstid');
    await fristSection.getByText('måneder', { exact: true }).click();
    await finishedRequest(setUnitTypeRequest, `Failed to set unit type to "måneder"`);

    const expectedFristInKabal = frist.getExtendedDate(vedtaksdato);

    await expect(fristSection).toContainText(expectedFristInKabal);
  });
