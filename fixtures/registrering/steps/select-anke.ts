import test, { type Page } from 'playwright/test';

export const selectAnke = async (page: Page) =>
  test.step('Velg type: anke', async () => {
    await page.getByRole('radio', { name: 'Anke', exact: true }).click();

    return page.getByText('Velg vedtaket anken gjelder');
  });
