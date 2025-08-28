import { test as base } from '@playwright/test';
import { RegistreringPage } from '@/fixtures/registrering/registrering-page';
import { StatusPage } from '@/fixtures/registrering/status-page';

interface Pages {
  registreringPage: RegistreringPage;
  statusPage: StatusPage;
}

export const test = base.extend<Pages>({
  registreringPage: async ({ page }, use) => {
    await use(new RegistreringPage(page));
  },

  statusPage: async ({ page }, use) => {
    await use(new StatusPage(page));
  },
});
