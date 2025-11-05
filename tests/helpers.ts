import { expect, type Page } from '@playwright/test';
import { DEV_DOMAIN, UI_DOMAIN } from '@/tests/functions';
import type { User } from '@/tests/test-data';

const goToAzure = async (page: Page, devDomain: string) => {
  const res = await page.goto(devDomain);
  expect(res).not.toBeNull();
  const url = res?.url();
  expect(url).toBeDefined();
  expect(url).toMatch('https://login.microsoftonline.com');

  return page;
};

export const logIn = async (page: Page, { username, password }: User, devDomain = DEV_DOMAIN, uiDomain = UI_DOMAIN) => {
  await goToAzure(page, devDomain);

  // Fill in username.
  await page.fill('input[type=email][name=loginfmt]', username);

  // Click "Next".
  await page.click('input[type=submit]');

  // Fill in password.
  await page.fill('input[type=password][tabindex="0"]', password);

  // Click "Sign in".
  await page.click('input[type=submit]');

  // If the UI domain is different from the login domain, navigate to that.
  if (!page.url().startsWith(UI_DOMAIN)) {
    await page.goto(uiDomain);
  }

  // Should be be at UI domain.
  expect(page.url()).toMatch(`${uiDomain}/`);

  return page;
};
