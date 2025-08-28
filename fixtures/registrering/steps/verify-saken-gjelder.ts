import test, { expect, type Page } from 'playwright/test';
import type { Part } from '@/fixtures/registrering/types';

export const verifySakenGjelder = async (page: Page, part: Part) =>
  test.step(`Verifiser saken gjelder: ${part.name}`, async () => {
    const sakenGjelderContainer = page.locator('[id="sakenGjelder"]');
    const sakenGjelder = (await sakenGjelderContainer.textContent())?.replace('Saken gjelder', '').trim();

    expect(sakenGjelder).toBe(part.getNameAndId());
  });
