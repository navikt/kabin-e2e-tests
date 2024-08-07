/* eslint-disable no-console */
import { Page, Request } from '@playwright/test';
import { makeDirectApiRequest } from '../fixtures/direct-api-request';

export const feilregistrerAndDelete = async (page: Page, kabalId: string) => {
  try {
    const res = await makeDirectApiRequest(page, 'kabal-api', `/behandlinger/${kabalId}/feilregistrer`, 'POST', {
      reason: 'E2E-test',
    });

    if (res.ok) {
      console.debug(`Feilregistrert oppgave: ${kabalId}`);
    } else {
      return console.error(`Feilregistrering failed for oppgave: ${kabalId}`, res.status);
    }
  } catch (e) {
    console.error(`Feilregistrering failed for oppgave: ${kabalId}`, e);

    return;
  }

  try {
    const res = await makeDirectApiRequest(page, 'kabal-api', `/internal/behandlinger/${kabalId}`, 'DELETE');

    if (res.ok) {
      console.debug(`Deleted oppgave: ${kabalId}`);
    } else {
      return console.error(`Delete failed for oppgave: ${kabalId}`, res.status);
    }
  } catch (e) {
    console.error(`Delete failed for oppgave: ${kabalId}`, e);
  }
};

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
export const STATUS_REGEX = new RegExp(`http(?:s?)://(?:.+)/(?:klage|anke)/(${UUID})/status`);
export const REGISTRERING_REGEX = new RegExp(`http(?:s?)://(?:.+)/registrering/(${UUID})`);

export const getIdFromStatusPage = (url: string): string => {
  const match = url.match(STATUS_REGEX);

  if (!match || typeof match[1] !== 'string') {
    throw new Error('Could not find id in url');
  }

  return match[1];
};

export const finishedRequest = async (requestPromise: Promise<Request>) => {
  const request = await requestPromise;
  const response = await request.response();

  if (response === null) {
    throw new Error('No response');
  }

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status()} - ${text}`);
  }

  return response.finished();
};
