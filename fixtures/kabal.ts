import type { Cookie } from '@playwright/test';
import { makeDirectApiRequest } from '@/fixtures/direct-api-request/direct-api-request';

class ResponseError extends Error {
  constructor(
    public readonly status: number,
    body: string,
  ) {
    super(`${status}: ${body}`);
    this.name = 'ResponseError';
  }
}

const deleteOppgave = async (cookies: Cookie[], kabalId: string) => {
  const res = await makeDirectApiRequest(
    `https://kabin.intern.dev.nav.no/api/kabal-api/internal/dev/behandlinger/${kabalId}`,
    'DELETE',
    cookies,
  );

  if (res.ok) {
    console.debug(`Deleted Kabal behandling ${kabalId}`);
  } else {
    const text = await res.text();
    throw new ResponseError(res.status, text);
  }
};

const exponentialBackoff = <T>(
  promise: () => Promise<T>,
  label: string,
  retries: number,
  delay = 1000,
  factor = 2,
): Promise<T> =>
  promise().catch((error) => {
    if (retries === 0) {
      throw error;
    }

    // Client errors are not transient. Retrying will not change the outcome.
    if (error instanceof ResponseError && error.status >= 400 && error.status < 500) {
      console.debug(`${label} failed: ${error.message}. Not retrying client error.`);

      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.debug(`${label} failed: ${errorMessage}. Retrying in ${delay}ms... Remaining retries: ${retries}`);

    return new Promise<T>((resolve) =>
      setTimeout(() => resolve(exponentialBackoff(promise, label, retries - 1, delay * factor, factor)), delay),
    );
  });

export const deleteKabalBehandling = async (cookies: Cookie[], kabalId: string) => {
  try {
    await exponentialBackoff(() => deleteOppgave(cookies, kabalId), 'Deletion', 3, 1000, 2);
  } catch (e) {
    console.error('Delete failed for oppgave:', kabalId, e);
  }
};
