import test, { expect, type Page } from '@playwright/test';
import type { Part } from '@/fixtures/registrering/types';

export const setAvsender = async (page: Page, part: Part) =>
  test.step(`Sett avsender: ${part.name}`, async () => {
    const fullmektigContainer = page.locator('[id="avsender"]');
    await fullmektigContainer.getByText('Søk').click();
    await fullmektigContainer.getByPlaceholder('Søk på ID-nummer').fill(part.id);
    await fullmektigContainer.getByText('Bruk').click();
  });

/** Kabin keeps the avsender of digitally sent inngående journalposter, and those older than a year. */
export const verifyAvsenderCannotBeChanged = async (page: Page) =>
  test.step('Verifiser at avsender ikke kan endres', async () => {
    await expect(page.getByText('Avsender kan ikke endres', { exact: true })).toBeVisible();
  });
