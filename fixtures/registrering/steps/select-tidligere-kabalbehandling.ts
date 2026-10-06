import test, { expect, type Page } from '@playwright/test';
import { finishedRequest } from '@/fixtures/finished-request';

/**
 * An anke on a vedtak from Infotrygd must also point to the tidligere behandling in Kabal it concerns,
 * whenever Kabal has behandlinger based on the same Infotrygd sak.
 */
export const selectFirstAvailableTidligereKabalbehandling = (page: Page) =>
  test.step('Velg første mulige tidligere behandling i Kabal', async () => {
    const muligheter = page.getByRole('table', { name: 'Kabal-muligheter' });
    await muligheter.waitFor();

    // Invalid muligheter have a disabled button. Unlike "Velg", this still matches the row once it is selected.
    const row = muligheter
      .locator('tbody tr')
      .filter({ hasNot: page.getByRole('button', { disabled: true }) })
      .first();

    const selectRequest = page.waitForRequest('**/registreringer/**/additional-kabal-mulighet');
    await row.getByRole('button', { name: 'Velg' }).click();
    await finishedRequest(selectRequest, 'Failed to select tidligere behandling i Kabal');

    await expect(row.getByRole('button', { name: 'Valgt' })).toBeVisible();
  });
