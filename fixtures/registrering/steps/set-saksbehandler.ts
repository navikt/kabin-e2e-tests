import test, { type Page } from 'playwright/test';

export const setSaksbehandler = async (page: Page, label: string) =>
  test.step('Sett saksbehandler', async () => {
    const saksbehandlerContainer = page.locator('[id="saksbehandlerId"]');
    await saksbehandlerContainer.getByLabel('Saksbehandler').selectOption({ label });
  });
