import test, { expect, type Page } from '@playwright/test';
import { finishedRequest } from '@/fixtures/finished-request';
import { getDokumentRow } from '@/fixtures/registrering/steps/upload/locators';

export const deleteDokument = async (page: Page, name: string) =>
  test.step(`Slett dokument: ${name}`, async () => {
    const deleteRequest = page.waitForRequest(
      (request) => request.method() === 'DELETE' && request.url().includes('/uploaded-documents/dokumenter/'),
    );
    await getDokumentRow(page, name).getByRole('button', { name: 'Slett', exact: true }).click();
    await finishedRequest(deleteRequest, `Failed to delete dokument "${name}"`);

    await expect(getDokumentRow(page, name)).toHaveCount(0);
  });
