import test, { expect, type Page } from '@playwright/test';
import { getDokumentRows, getUploadSection } from '@/fixtures/registrering/steps/upload/locators';

const DROP_ZONE_HINT = 'Dra og slipp dokumenter her, eller trykk på «Last opp»';

export const verifyEmptyUpload = async (page: Page) =>
  test.step('Verifiser tom dokumentliste', async () => {
    const uploadSection = getUploadSection(page);

    await expect(uploadSection.getByRole('heading', { name: 'Opplastede dokumenter' })).toBeVisible();
    await expect(uploadSection.getByText('PDF, JPG, PNG eller TIFF')).toBeVisible();
    await expect(uploadSection.getByText(DROP_ZONE_HINT)).toBeVisible();
    await expect(uploadSection.getByText('Ingen dokumenter', { exact: true })).toBeVisible();
    await expect(getDokumentRows(page)).toHaveCount(0);

    await expect(page.getByText('Opplastede dokumenter blir journalført ved fullføring.')).toBeVisible();
  });
