import { chromium, type FullConfig, type Page } from '@playwright/test';
import { storageState } from '@/playwright.config';
import { deleteStaleTestSaker } from '@/setup/delete-stale-test-saker';
import { DEV_DOMAIN, UI_DOMAIN, USE_LOCALHOST } from '@/tests/functions';
import { logIn } from '@/tests/helpers';
import { userSaksbehandler } from '@/tests/test-data';

const globalSetup = async (_config: FullConfig) => {
  console.debug(`Using ${process.env.CONFIG ?? 'local'} config.`);
  console.debug(`Running tests against ${UI_DOMAIN}\n`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await logIn(page, userSaksbehandler);

  if (USE_LOCALHOST) {
    await setLocalhostCookie(page);
  }

  await deleteStaleTestSaker(await page.context().cookies(UI_DOMAIN));

  if (typeof storageState === 'string') {
    await page.context().storageState({ path: storageState });
  }

  await browser.close();
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
