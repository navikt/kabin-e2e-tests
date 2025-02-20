import { type Page, expect } from '@playwright/test';
import { DEV_DOMAIN, LOCAL_DOMAIN, UI_DOMAIN, USE_DEV } from './functions';
import type { User } from './test-data';

const goToAzure = async (page: Page, devDomain: string) => {
  const res = await page.goto(devDomain);
  expect(res).not.toBeNull();
  const url = res?.url();
  expect(url).toBeDefined();
  expect(url).toMatch('https://login.microsoftonline.com');

  return page;
};

export const logIn = async (
  page: Page,
  { username, password }: User,
  devDomain = DEV_DOMAIN,
  localDomain = LOCAL_DOMAIN,
  uiDomain = UI_DOMAIN,
) => {
  await goToAzure(page, devDomain);

  // Fill in username.
  await page.fill('input[type=email][name=loginfmt]', username);

  // Click "Next".
  await page.click('input[type=submit]');

  // Fill in password.
  await page.fill('input[type=password][tabindex="0"]', password);

  // Click "Sign in".
  await page.click('input[type=submit]');

  // Click "No" to remember login.
  await page.click('input[type=button]');

  // Force navigation to local domain, if not using dev domain.
  if (!USE_DEV) {
    await page.goto(localDomain);
  }

  // Browser should be redirected to Kabin.
  expect(page.url()).toMatch(`${uiDomain}/`);

  return page;
};
