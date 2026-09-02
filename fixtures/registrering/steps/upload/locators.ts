import type { Page } from '@playwright/test';

export const getUploadSection = (page: Page) => page.getByRole('region', { name: 'Last opp dokumenter' });

export const getDokumentList = (page: Page) => getUploadSection(page).getByRole('list');

export const getDokumentRows = (page: Page) => getDokumentList(page).getByRole('listitem');

/** The name button is the only element in a row with a `title`; the rest use `aria-label`. */
export const getDokumentNames = (page: Page) => getDokumentRows(page).locator('button[title]');

export const getDokumentRow = (page: Page, name: string) =>
  getDokumentRows(page).filter({ has: page.getByRole('button', { name, exact: true }) });

/** The heading is always present inside the drop zone, also when no documents are uploaded. */
export const getDropZone = (page: Page) =>
  getUploadSection(page).getByRole('heading', { name: 'Opplastede dokumenter' });
