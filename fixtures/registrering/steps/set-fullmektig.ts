import test, { type Page } from 'playwright/test';
import type { Part } from '@/fixtures/registrering/types';

export const setFullmektig = async (page: Page, part: Part) =>
  test.step(`Sett fullmektig: ${part.name}`, async () => {
    const fullmektigContainer = page.locator('[id="fullmektig"]');
    await fullmektigContainer.getByText('Søk').click();
    await fullmektigContainer.getByPlaceholder('Søk på ID-nummer').fill(part.id);
    await fullmektigContainer.getByText('Bruk').click();
  });
