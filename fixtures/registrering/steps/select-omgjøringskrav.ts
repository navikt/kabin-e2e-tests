import test, { type Page } from 'playwright/test';

export const selectOmgjøringskrav = async (page: Page) =>
  test.step('Velg type: omgjøringskrav', async () => {
    await page.getByRole('radio', { name: 'Omgjøringskrav', exact: true }).click();

    return page.getByText('Velg vedtaket omgjøringskravet gjelder');
  });
