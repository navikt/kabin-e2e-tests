import test, { expect, type Page } from '@playwright/test';
import { finishedRequest } from '@/fixtures/finished-request';
import { getDokumentRow, getUploadSection } from '@/fixtures/registrering/steps/upload/locators';

export const renameDokument = async (page: Page, currentName: string, newName: string) =>
  test.step(`Endre dokumentnavn: «${currentName}» → «${newName}»`, async () => {
    await getDokumentRow(page, currentName).getByRole('button', { name: 'Endre navn', exact: true }).click();

    // The row loses its name button while editing, and only one row can edit at a time.
    const nameInput = getUploadSection(page).getByLabel('Endre filnavn');
    await nameInput.fill(newName);

    const setNameRequest = page.waitForRequest('**/uploaded-documents/dokumenter/*/name');
    await nameInput.press('Enter');
    await finishedRequest(setNameRequest, `Failed to rename dokument "${currentName}" to "${newName}"`);

    await expect(getDokumentRow(page, newName)).toHaveCount(1);
    await expect(getDokumentRow(page, currentName)).toHaveCount(0);
  });
