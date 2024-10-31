import test, { type Page } from '@playwright/test';

export class AnkePage {
  constructor(public readonly page: Page) {}

  selectAnke = async () =>
    test.step('Velg type: anke', async () => {
      await this.page.getByRole('radio', { name: 'Anke', exact: true }).click();

      return this.page.getByText('Velg vedtaket anken gjelder');
    });
}
