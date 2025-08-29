import test, { type Page } from 'playwright/test';

export const selectKlage = async (page: Page) =>
  test.step('Velg type: klage', async () => {
    await page.getByRole('radio', { name: 'Klage', exact: true }).click();

    return page.getByText('Velg vedtaket klagen gjelder');
  });
