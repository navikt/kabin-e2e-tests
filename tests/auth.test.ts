import { expect, test } from '@playwright/test';
import { getParsedUrl } from './functions';
import { getLoggedInPage, goToAzure } from './helpers';
import { userSaksbehandler } from './test-data';

test.describe('Ikke innlogget', () => {
  // Don't reuse logged in state for these tests.
  test.use({ storageState: { cookies: [], origins: [] } });

  // expects are inside helper
  // eslint-disable-next-line playwright/expect-expect
  test('Uautentisert/uautorisert bruker av Kabin skal sendes til innlogging i Azure', async ({ page }) => {
    await goToAzure(page);
  });

  test('Bruker skal sendes tilbake til Kabin etter innlogging', async ({ page }) => {
    const path = '/opprett';
    const loggedInPage = await getLoggedInPage(page, userSaksbehandler, path);

    const url = getParsedUrl(loggedInPage.url());
    expect(url.pathname).toBe(path);
  });
});
