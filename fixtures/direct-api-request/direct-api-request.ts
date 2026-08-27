import type { Cookie } from '@playwright/test';

type Method = RequestInit['method'];

export const makeDirectApiRequest = async <T>(url: string, method: Method, cookies: Cookie[], body?: T) => {
  const parsedUrl = URL.parse(url);

  if (parsedUrl === null) {
    throw new Error(`${method} ${url} - Invalid URL.`);
  }

  try {
    return fetch(parsedUrl, {
      method,
      body: JSON.stringify(body),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Cookie: toCookieHeader(parsedUrl, cookies),
      },
    });
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`${method} ${url} - ${e.message}.`);
    }

    throw new Error(`${method} ${url} - Unkown error.`);
  }
};

/**
 * Builds a `Cookie` header containing only the cookies that actually belong to `url`.
 *
 * Callers hand us everything `BrowserContext.cookies()` returns, which is every cookie in the
 * context across every domain it has talked to - including the handful of large cookies the Azure
 * sign-in leaves behind on `login.microsoftonline.com` (`ESTSAUTHPERSISTENT` alone is several
 * kilobytes). Sending those to Nav's APIs is pointless, and together they push the request past
 * the server's max header size, which fails the request with `431 Request Header Fields Too
 * Large` rather than anything that hints at cookies.
 */
const toCookieHeader = (url: URL, cookies: Cookie[]): string =>
  cookies
    .filter((cookie) => appliesTo(cookie, url))
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

/** Whether a browser would send `cookie` to `url`. See RFC 6265, sections 5.1.3 - 5.4. */
export const appliesTo = (cookie: Cookie, url: URL): boolean =>
  domainMatches(cookie, url.hostname) && pathMatches(cookie, url.pathname) && secureMatches(cookie, url.protocol);

/** A leading dot marks a domain cookie, which also applies to every subdomain. Without it the
 * cookie is host-only, and applies to exactly the host that set it. */
export const domainMatches = ({ domain }: Cookie, hostname: string): boolean =>
  domain.startsWith('.') ? hostname === domain.slice(1) || hostname.endsWith(domain) : hostname === domain;

export const pathMatches = ({ path }: Cookie, pathname: string): boolean =>
  pathname === path || (pathname.startsWith(path) && (path.endsWith('/') || pathname.at(path.length) === '/'));

export const secureMatches = ({ secure }: Cookie, protocol: string): boolean => !secure || protocol === 'https:';
