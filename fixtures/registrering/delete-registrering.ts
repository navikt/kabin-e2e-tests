import type { Page } from 'playwright/test';
import { makeDirectApiRequest } from '@/fixtures/direct-api-request';
import { REGISTRERING_REGEX } from '@/fixtures/finished-request';

export const deleteRegistrering = async (page: Page) => {
  const url = page.url();

  const registreringMatch = url.match(REGISTRERING_REGEX);

  if (registreringMatch !== null) {
    const [, registreringId] = registreringMatch;

    if (typeof registreringId === 'string') {
      const cookies = await page.context().cookies();

      await makeDirectApiRequest(
        `https://kabin.intern.dev.nav.no/api/registrering/${registreringId}`,
        'DELETE',
        cookies,
      );

      console.info('Deleted registrering with id:', registreringId);

      return;
    }
  }

  console.warn(`No registrering to delete at: ${url}`);
};
