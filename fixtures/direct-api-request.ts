import type { Cookie } from '@playwright/test';

type Method = RequestInit['method'];

export const makeDirectApiRequest = async <T>(url: string, method: Method, cookies: Cookie[], body?: T) => {
  try {
    return fetch(url, {
      method,
      body: JSON.stringify(body),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Cookie: cookies.map(({ name, value }) => `${name}=${value}`).join('; '),
      },
    });
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`${method} ${url} - ${e.message}.`);
    }

    throw new Error(`${method} ${url} - Unkown error.`);
  }
};
