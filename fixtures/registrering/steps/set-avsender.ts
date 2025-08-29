import test, { type Page } from 'playwright/test';
import type { Part } from '@/fixtures/registrering/types';

export const setAvsender = async (page: Page, part: Part) =>
  test.step(`Sett avsender: ${part.name}`, async () => {
    const fullmektigContainer = page.locator('[id="avsender"]');
    await fullmektigContainer.getByText('Søk').click();
    await fullmektigContainer.getByPlaceholder('Søk på ID-nummer').fill(part.id);
    await fullmektigContainer.getByText('Bruk').click();
  });
