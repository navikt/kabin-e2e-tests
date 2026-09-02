import test, { expect, type Page } from '@playwright/test';

/** Sakstype requires at least one uploaded document. */
export const verifyNoSakstypeBeforeUpload = async (page: Page) =>
  test.step('Verifiser at sakstype krever et opplastet dokument', async () => {
    await expect(page.getByText('Last opp dokument for å velge sakstype.')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Anke', exact: true })).toHaveCount(0);
  });

/** Klager always arrive as an existing journalpost. */
export const verifyKlageIsUnavailable = async (page: Page) =>
  test.step('Verifiser at klage ikke kan velges for opplastede dokumenter', async () => {
    await expect(page.getByRole('radio', { name: 'Klage', exact: true })).toHaveCount(0);
    await expect(page.getByRole('radio', { name: 'Anke', exact: true })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Omgjøringskrav', exact: true })).toBeVisible();
  });
