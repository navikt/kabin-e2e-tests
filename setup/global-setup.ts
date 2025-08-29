import { chromium, type Page } from '@playwright/test';
import type { FullConfig } from '@playwright/test/reporter';
import { feilregistrerKabalBehandlinger } from '@/setup/feilregistrer-and-delete';
import { DEV_DOMAIN, UI_DOMAIN, USE_LOCALHOST } from '@/tests/functions';
import { logIn } from '@/tests/helpers';
import { userSaksbehandler } from '@/tests/test-data';

const globalSetup = async (config: FullConfig) => {
  console.debug(`Using ${process.env.CONFIG ?? 'local'} config.`);
  console.debug(`Running tests against ${UI_DOMAIN}\n`);

  const { storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await logIn(page, userSaksbehandler);

  if (typeof storageState === 'string') {
    if (USE_LOCALHOST) {
      await setLocalhostCookie(page);
    }

    await page.context().storageState({ path: storageState });
  }

  await browser.close();

  await feilregistrerKabalBehandlinger();
};

export default globalSetup;

const setLocalhostCookie = async (page: Page) => {
  const cookies = await page.context().cookies(DEV_DOMAIN);

  if (!Array.isArray(cookies) || cookies.length === 0) {
    throw new Error(`Did not find any cookies for ${DEV_DOMAIN}`);
  }

  if (cookies.length > 1) {
    throw new Error(`Found more than one cookie for ${DEV_DOMAIN}`);
  }

  await page.context().clearCookies();

  await page.context().addCookies([{ ...cookies[0], domain: 'localhost' }]);
};
