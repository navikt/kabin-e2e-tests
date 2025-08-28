import test, { type Page } from 'playwright/test';
import type { Part } from '@/fixtures/registrering/types';

export const setKlager = async (page: Page, part: Part) =>
  test.step(`Sett klager: ${part.name}`, async () => setKlagerOrAnkendePart(page, part));

export const setAnkendePart = async (page: Page, part: Part) =>
  test.step(`Sett ankende part: ${part.name}`, async () => setKlagerOrAnkendePart(page, part));

const setKlagerOrAnkendePart = async (page: Page, part: Part) => {
  const klagerContainer = page.locator('[id="klager"]');
  await klagerContainer.getByText('Søk').click();
  await klagerContainer.getByPlaceholder('Søk på ID-nummer').fill(part.id);
  await klagerContainer.getByText('Bruk').click();
};
