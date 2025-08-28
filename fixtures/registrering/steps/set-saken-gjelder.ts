import test, { type Page } from 'playwright/test';
import type { Part } from '@/fixtures/registrering/types';

export const setSakenGjelder = async (page: Page, SAKEN_GJELDER: Part) =>
  test.step(`Sett saken gjelder: ${SAKEN_GJELDER.name}`, async () => {
    await page.getByPlaceholder('Opprett ny registrering').fill(SAKEN_GJELDER.id);
  });
