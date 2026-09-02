import test, { expect, type Page } from '@playwright/test';
import { STATUS_REGEX } from '@/fixtures/finished-request';
import { feilregistrerAndDelete } from '@/fixtures/kabal';
import { Sakstype } from '@/fixtures/registrering/types';

export const finish = async (page: Page, type: Sakstype) =>
  test.step('Fullfør', async () => {
    await page.getByText('Fullfør', { exact: true }).click();
    const requestPromise = page.waitForRequest('**/registreringer/**/ferdigstill');
    await page.getByText('Bekreft', { exact: true }).click();
    const request = await requestPromise;
    const response = await request.response();

    if (response === null) {
      throw new Error('No response');
    }

    await page.waitForURL(STATUS_REGEX);

    const res: unknown = await response.json();

    if (!isStatusResponse(res)) {
      throw new Error('Invalid response');
    }

    const cookies = await page.context().cookies();

    feilregistrerAndDelete(cookies, res.behandlingId);

    const main = page.getByRole('main');
    await expect(main).toContainText(FINISH_TEXT_MAP[type]);
  });

/** A single error in the validation summary, as it is rendered: `«{fieldName}: {reason}»`. */
export interface ValidationError {
  /** Label of the field the error belongs to, e.g. `Opplastede dokumenter`. */
  fieldName: string;
  reason: string;
}

/**
 * Attempts to finish, expecting Kabin API to reject it, and verifies that the saksdata section of
 * the validation summary lists exactly `errors` - no more, no less.
 *
 * Leaves the registrering editable again, so the errors can be fixed and finishing retried.
 */
export const finishExpectingSaksdataErrors = async (page: Page, type: Sakstype, errors: ValidationError[]) =>
  test.step(`Fullfør med forventede valideringsfeil: ${errors.map(({ reason }) => reason).join(' ')}`, async () => {
    await page.getByRole('button', { name: 'Fullfør', exact: true }).click();
    await page.getByRole('button', { name: 'Bekreft', exact: true }).click();

    // The summary opens by itself as soon as the request comes back with the validation errors.
    await expect(page.getByRole('heading', { name: VALIDATION_SUMMARY_HEADING, exact: true })).toBeVisible();

    const items = getValidationSection(page, SAKSDATA_SECTION_MAP[type]).getByRole('listitem');

    await expect(items).toHaveCount(errors.length);

    // Checked one by one rather than with `toHaveText`, since the order the API returns the errors
    // in is an implementation detail.
    for (const { fieldName, reason } of errors) {
      await expect(items.filter({ hasText: `${fieldName}: ${reason}` })).toHaveCount(1);
    }

    // The confirmation popover stays open when finishing fails, covering part of the form.
    await page.getByRole('button', { name: 'Avbryt', exact: true }).click();
  });

const VALIDATION_SUMMARY_HEADING = 'Kan ikke fullføre registrering. Dette mangler:';

/** The title the saksdata errors are grouped under. Kabin words it differently per sakstype. */
const SAKSDATA_SECTION_MAP: Record<Sakstype, string> = {
  [Sakstype.KLAGE]: 'Tilpasninger for klagen',
  [Sakstype.ANKE]: 'Saksdata',
  [Sakstype.OMGJØRINGSKRAV]: 'Tilpasninger for omgjøringskravet',
  [Sakstype.BEGJÆRING_OM_GJENOPPTAK]: 'Tilpasninger for begjæringen om gjenopptak',
};

/**
 * The validation summary has no landmark role of its own, so it is located from its heading - the
 * `article` holding one `section` per validation section is the heading's sibling.
 */
const getValidationSection = (page: Page, title: string) =>
  page
    .getByRole('heading', { name: VALIDATION_SUMMARY_HEADING, exact: true })
    .locator('xpath=following-sibling::article')
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) });

const isStatusResponse = (response: unknown): response is { behandlingId: string } =>
  typeof response === 'object' &&
  response !== null &&
  'behandlingId' in response &&
  typeof response.behandlingId === 'string';

const FINISH_TEXT_MAP: Record<Sakstype, string> = {
  [Sakstype.KLAGE]: 'Klage opprettet',
  [Sakstype.ANKE]: 'Anke opprettet',
  [Sakstype.OMGJØRINGSKRAV]: 'Omgjøringskrav opprettet',
  [Sakstype.BEGJÆRING_OM_GJENOPPTAK]: 'Begjæring om gjenopptak opprettet',
};
