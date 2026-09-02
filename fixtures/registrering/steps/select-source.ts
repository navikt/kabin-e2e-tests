import test, { expect, type Page } from '@playwright/test';
import { finishedRequest } from '@/fixtures/finished-request';
import { DocumentSource } from '@/fixtures/registrering/types';

/** How long the creation of a registrering may take before the source options are expected. */
const REGISTRERING_CREATED_TIMEOUT = 30_000;

export const verifySourceOptions = async (page: Page) =>
  test.step('Verifiser valg av dokumentkilde', async () => {
    // Nothing below the search field is rendered until the registrering has been created, so this
    // first assertion is what waits for that - and creating one is slow enough to need the room.
    await expect(getSourceOption(page, DocumentSource.JOURNALPOST)).toBeEnabled({
      timeout: REGISTRERING_CREATED_TIMEOUT,
    });
    await expect(getSourceOption(page, DocumentSource.UPLOAD)).toBeEnabled();
    await expect(getSourceOption(page, DocumentSource.ANKE)).toBeDisabled();
  });

export const selectSource = async (page: Page, source: DocumentSource) =>
  test.step(`Velg dokumentkilde: ${source}`, async () => {
    const setSourceRequest = page.waitForRequest('**/registreringer/**/source');
    await getSourceOption(page, source).click();
    await finishedRequest(setSourceRequest, `Failed to set source "${source}"`);

    await expect(getSourceOption(page, source)).toBeChecked();
  });

const getSourceOption = (page: Page, source: DocumentSource) => page.getByRole('radio', { name: source, exact: true });
