import test, { expect, type Page } from '@playwright/test';
import { finishedRequest } from '@/fixtures/finished-request';
import {
  getDokumentList,
  getDokumentNames,
  getDokumentRow,
  getDokumentRows,
} from '@/fixtures/registrering/steps/upload/locators';
import { verifyDokumentOrder } from '@/fixtures/registrering/steps/upload/verify-dokumenter';

/** Tooltip of the button that moves a document to the top. */
const SET_HOVEDDOKUMENT_LABEL = 'Sett som hoveddokument';

/** The drag grip. Not focusable and unnamed, so it must be located by attribute. */
const DRAG_HANDLE = '[data-drag-handle]';

/** The hoveddokument is the first document, marked only by lacking the promote button. */
export const verifyHoveddokument = async (page: Page, name: string) =>
  test.step(`Verifiser hoveddokument: ${name}`, async () => {
    await expect(getDokumentNames(page).first()).toHaveText(name);
    await expect(getDokumentRow(page, name).getByRole('button', { name: SET_HOVEDDOKUMENT_LABEL })).toHaveCount(0);

    // Exactly one row lacks the button.
    const rowCount = await getDokumentRows(page).count();
    await expect(getDokumentList(page).getByRole('button', { name: SET_HOVEDDOKUMENT_LABEL })).toHaveCount(
      rowCount - 1,
    );
  });

/** A document cannot be moved past either end of the list. */
export const verifyMoveDokumentLimits = async (page: Page) =>
  test.step('Verifiser at dokumentene ikke kan flyttes ut av listen', async () => {
    const rows = getDokumentRows(page);

    await expect(rows.first().getByRole('button', { name: 'Flytt opp', exact: true })).toBeDisabled();
    await expect(rows.first().getByRole('button', { name: 'Flytt ned', exact: true })).toBeEnabled();

    await expect(rows.last().getByRole('button', { name: 'Flytt ned', exact: true })).toBeDisabled();
    await expect(rows.last().getByRole('button', { name: 'Flytt opp', exact: true })).toBeEnabled();
  });

export const moveDokumentUp = async (page: Page, name: string, expectedOrder: string[]) =>
  moveDokument(page, name, 'Flytt opp', expectedOrder);

export const moveDokumentDown = async (page: Page, name: string, expectedOrder: string[]) =>
  moveDokument(page, name, 'Flytt ned', expectedOrder);

const moveDokument = async (page: Page, name: string, buttonName: string, expectedOrder: string[]) =>
  test.step(`${buttonName}: ${name}`, async () => {
    // A move is persisted as a new sortIndex.
    const setSortIndexRequest = page.waitForRequest('**/uploaded-documents/dokumenter/*/sort-index');
    await getDokumentRow(page, name).getByRole('button', { name: buttonName, exact: true }).click();
    await finishedRequest(setSortIndexRequest, `Failed to move dokument "${name}" (${buttonName})`);

    await verifyDokumentOrder(page, expectedOrder);
  });

/**
 * Drags a row onto another, taking its place. The rows use native drag and drop events rather than
 * the mouse, so `dragTo` does not work and the events are synthesised here.
 */
export const dragDokumentOnto = async (page: Page, name: string, targetName: string, expectedOrder: string[]) =>
  test.step(`Dra «${name}» til plassen til «${targetName}»`, async () => {
    const row = getDokumentRow(page, name);
    const dragHandle = row.locator(DRAG_HANDLE);
    const list = getDokumentList(page);

    // A row is only draggable while its drag handle is held down.
    await dragHandle.dispatchEvent('pointerdown');

    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());

    await row.dispatchEvent('dragstart', { dataTransfer });
    await getDokumentRow(page, targetName).dispatchEvent('dragenter', { dataTransfer });

    // Entering another row previews the resulting order, and the drop persists the preview.
    await verifyDokumentOrder(page, expectedOrder);

    // The list, not the row, handles the drop.
    const setSortIndexRequest = page.waitForRequest('**/uploaded-documents/dokumenter/*/sort-index');
    await list.dispatchEvent('dragover', { dataTransfer });
    await list.dispatchEvent('drop', { dataTransfer });
    await finishedRequest(setSortIndexRequest, `Failed to drag dokument "${name}" onto "${targetName}"`);

    await dataTransfer.dispose();
    await dragHandle.dispatchEvent('pointerup');

    await verifyDokumentOrder(page, expectedOrder);
  });

export const setHoveddokument = async (page: Page, name: string) =>
  test.step(`Sett som hoveddokument: ${name}`, async () => {
    const setSortIndexRequest = page.waitForRequest('**/uploaded-documents/dokumenter/*/sort-index');
    await getDokumentRow(page, name).getByRole('button', { name: SET_HOVEDDOKUMENT_LABEL, exact: true }).click();
    await finishedRequest(setSortIndexRequest, `Failed to set "${name}" as hoveddokument`);

    await verifyHoveddokument(page, name);
  });
