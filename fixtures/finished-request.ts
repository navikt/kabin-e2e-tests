import type { Request } from '@playwright/test';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const REGISTRERING = `http(?:s?)://(?:.+)/registrering/(${UUID})`;
export const REGISTRERING_REGEX = new RegExp(`${REGISTRERING}`);
export const STATUS_REGEX = new RegExp(`${REGISTRERING}/status`);

export const finishedRequest = async (requestPromise: Promise<Request>, prefix = 'Request failed') => {
  const request = await requestPromise;
  const response = await request.response();

  if (response === null) {
    throw new RequestError(`${prefix}: No response`);
  }

  if (!response.ok()) {
    const text = await response.text();
    throw new RequestError(`${prefix}: ${response.status()} - ${text}`);
  }

  return response.finished();
};

class RequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestError';
  }
}
