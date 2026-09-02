import test, { expect, type Page } from '@playwright/test';
import { getDokumentNames, getUploadSection } from '@/fixtures/registrering/steps/upload/locators';

export const verifyDokumentCount = async (page: Page, expectedCount: string) =>
  test.step(`Verifiser dokumentantall: ${expectedCount}`, async () => {
    await expect(getUploadSection(page).getByText(expectedCount, { exact: true })).toBeVisible();
  });

export const verifyDokumentOrder = async (page: Page, expectedNames: string[]) =>
  test.step(`Verifiser dokumentrekkefølge: ${expectedNames.join(' → ')}`, async () => {
    await expect(getDokumentNames(page)).toHaveText(expectedNames);
  });
