import test, { type Page } from '@playwright/test';

export const selectBegjæringOmGjenopptak = async (page: Page) =>
  test.step('Velg type: begjæring om gjenopptak', async () => {
    await page.getByRole('radio', { name: 'Begjæring om gjenopptak', exact: true }).click();

    return page.getByText('Velg behandlingen begjæringen om gjenopptak gjelder');
  });
