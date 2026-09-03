import test, { expect, type Page } from '@playwright/test';
import { getDokumentRow, getDropZone, getUploadSection } from '@/fixtures/registrering/steps/upload/locators';
import type { UploadFile } from '@/fixtures/registrering/types';

/** Upload, virus scan and conversion combined. */
const DOKUMENT_READY_TIMEOUT = 60_000;

/** Status tooltip for `DONE`. */
const DOKUMENT_READY_LABEL = 'Dokumentet er klart til journalføring';

/** Status tooltip for rejected file type. */
export const UNSUPPORTED_TYPE_LABEL = 'Filtypen støttes ikke. Slett filen.';

/** Status tooltip for failed virus scan. */
export const VIRUS_FOUND_LABEL = 'Fant virus i filen. Filen kan ikke brukes.';

/** Both ways of adding documents must work. */
export enum UploadMethod {
  FILE_INPUT = 'filvelger',
  DRAG_AND_DROP = 'dra og slipp',
}

export const addDokumenter = async (
  page: Page,
  files: UploadFile[],
  method: UploadMethod,
  expectedStatusLabel: string = DOKUMENT_READY_LABEL,
) =>
  test.step(`Legg til dokumenter med ${method}: ${files.map(({ name }) => name).join(', ')}`, async () => {
    if (method === UploadMethod.DRAG_AND_DROP) {
      await dropDokumenter(page, files);
    } else {
      await getUploadSection(page).locator('input[type="file"]').setInputFiles(files);
    }

    // The row appears immediately, but reaches its final status only after server-side processing.
    for (const { name } of files) {
      await expect(getDokumentRow(page, name).getByLabel(expectedStatusLabel, { exact: true })).toBeVisible({
        timeout: DOKUMENT_READY_TIMEOUT,
      });
    }
  });

/**
 * Playwright cannot drop real files, so the `DataTransfer` is built in-page from base64.
 *
 * Everything happens in a single `evaluate` on purpose. `locator.dispatchEvent` has to install
 * Playwright's injected script in the page's own JavaScript world, which has been observed to hang
 * the renderer indefinitely, and it would need the `DataTransfer` handle to survive three separate
 * round trips.
 */
const dropDokumenter = async (page: Page, files: UploadFile[]) =>
  getDropZone(page).evaluate(
    (element, encodedFiles) => {
      const dataTransfer = new DataTransfer();

      for (const { name, mimeType, base64 } of encodedFiles) {
        const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
        dataTransfer.items.add(new File([bytes], name, { type: mimeType }));
      }

      const eventInit = { dataTransfer, bubbles: true, cancelable: true, composed: true };

      // The drop is only accepted after the drag is announced.
      element.dispatchEvent(new DragEvent('dragenter', eventInit));
      element.dispatchEvent(new DragEvent('dragover', eventInit));
      element.dispatchEvent(new DragEvent('drop', eventInit));
    },
    files.map(({ name, mimeType, buffer }) => ({ name, mimeType, base64: buffer.toString('base64') })),
  );
