import test, { expect, type Page } from '@playwright/test';
import { finishedRequest } from '@/fixtures/finished-request';
import type { InngaaendeKanal } from '@/fixtures/registrering/types';

export const setInngaaendeKanal = async (page: Page, inngaaendeKanal: InngaaendeKanal) =>
  test.step(`Sett inngående kanal: ${inngaaendeKanal}`, async () => {
    const kanalGroup = page.getByRole('radiogroup', { name: 'Inngående kanal' });

    const setInngaaendeKanalRequest = page.waitForRequest('**/uploaded-documents/inngaaende-kanal');
    await kanalGroup.getByRole('radio', { name: inngaaendeKanal, exact: true }).click();
    await finishedRequest(setInngaaendeKanalRequest, `Failed to set inngående kanal "${inngaaendeKanal}"`);

    // Remounted on change, so it must be re-located.
    await expect(
      page.getByRole('radiogroup', { name: 'Inngående kanal' }).getByRole('radio', { name: inngaaendeKanal }),
    ).toHaveAttribute('aria-checked', 'true');
  });
