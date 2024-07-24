import test, { Page } from '@playwright/test';

export class RegistreringerPage {
  constructor(public readonly page: Page) {}

  createRegistrering = async () =>
    test.step('Opprett ny registrering', async () => {
      await this.page.getByText('Opprett ny registrering').click();
      await this.page.waitForURL('**/registrering/*');
    });
}
