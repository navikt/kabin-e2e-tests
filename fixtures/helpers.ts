/* eslint-disable no-console */
import { Page } from '@playwright/test';
import { makeDirectApiRequest } from '../fixtures/direct-api-request';

export const feilregistrerAndDelete = async (page: Page, kabalId: string) => {
  try {
    await makeDirectApiRequest(page, 'kabal-api', `/behandlinger/${kabalId}/feilregistrer`, 'POST', {
      reason: 'E2E-test',
    });
  } catch (e) {
    console.error(`Feilregistrering failed for oppgave: ${kabalId}`, e);

    return;
  }

  console.debug(`Feilregistrert oppgave: ${kabalId}`);

  try {
    await makeDirectApiRequest(page, 'kabal-api', `/internal/behandlinger/${kabalId}`, 'DELETE');
  } catch (e) {
    console.error(`Delete failed for oppgave: ${kabalId}`, e);
  }

  console.debug(`Deleted oppgave: ${kabalId}`);
};

export const STATUS_REGEX = /http(?:s?):\/\/(.+)\/(anke|klage)\/([a-z0-9-]+)\/status/;

export const getIdFromStatusPage = (url: string): string => {
  const match = url.match(STATUS_REGEX);

  if (!match || typeof match[3] !== 'string') {
    throw new Error('Could not find id in url');
  }

  return match[3];
};
