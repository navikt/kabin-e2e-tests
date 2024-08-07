import { test as base } from '@playwright/test';
import { AnkePage } from './anke-page';
import { KabinPage } from './kabin-page';
import { KlagePage } from './klage-page';
import { RegistreringerPage } from './registreringer-page';
import { StatusPage } from './status-page';

interface Pages {
  registreringerPage: RegistreringerPage;
  kabinPage: KabinPage;
  klagePage: KlagePage;
  ankePage: AnkePage;
  statusPage: StatusPage;
}

export const test = base.extend<Pages>({
  registreringerPage: async ({ page }, use) => {
    await use(new RegistreringerPage(page));
  },

  kabinPage: async ({ page }, use) => {
    await use(new KabinPage(page));
  },

  klagePage: async ({ page }, use) => {
    await use(new KlagePage(page));
  },

  ankePage: async ({ page }, use) => {
    await use(new AnkePage(page));
  },

  statusPage: async ({ page }, use) => {
    await use(new StatusPage(page));
  },
});
