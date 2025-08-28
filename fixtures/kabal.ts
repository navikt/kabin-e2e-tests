import type { Cookie } from '@playwright/test';
import { makeDirectApiRequest } from '@/fixtures/direct-api-request';

const feilRegistrer = async (cookies: Cookie[], kabalId: string) => {
  const res = await makeDirectApiRequest(
    `https://kabin.intern.dev.nav.no/api/kabal-api/behandlinger/${kabalId}/feilregistrer`,
    'POST',
    cookies,
    { reason: 'Reservert testbruker' },
  );

  if (res.ok) {
    console.debug(`Feilregistrert oppgave with id: ${kabalId}`);
  } else {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
};

const deleteOppgave = async (cookies: Cookie[], kabalId: string) => {
  const res = await makeDirectApiRequest(
    `https://kabin.intern.dev.nav.no/api/kabal-api/internal/dev/behandlinger/${kabalId}`,
    'DELETE',
    cookies,
  );

  if (res.ok) {
    console.debug(`Deleted oppgave with id: ${kabalId}`);
  } else {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
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

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.debug(`${label} failed: ${errorMessage}. Retrying in ${delay}ms... Remaining retries: ${retries}`);

    return new Promise<T>((resolve) =>
      setTimeout(() => resolve(exponentialBackoff(promise, label, retries - 1, delay * factor, factor)), delay),
    );
  });

export const feilregistrerAndDelete = async (cookies: Cookie[], kabalId: string) => {
  try {
    await exponentialBackoff(() => feilRegistrer(cookies, kabalId), 'Feilregistrering', 3, 1000, 2);
  } catch (e) {
    console.error('Feilregistrering failed for oppgave:', kabalId, e);
  }

  try {
    await exponentialBackoff(() => deleteOppgave(cookies, kabalId), 'Deletion', 3, 1000, 2);
  } catch (e) {
    console.error('Delete failed for oppgave:', kabalId, e);
  }
};
