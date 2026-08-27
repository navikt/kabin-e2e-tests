import { describe, expect, it } from 'bun:test';
import type { Cookie } from '@playwright/test';
import { appliesTo, domainMatches, pathMatches, secureMatches } from '@/fixtures/direct-api-request/direct-api-request';

const cookie = (overrides: Partial<Cookie> = {}): Cookie => ({
  name: 'session',
  value: 'abc',
  domain: 'kabin.intern.dev.nav.no',
  path: '/',
  expires: -1,
  httpOnly: true,
  secure: true,
  sameSite: 'Lax',
  ...overrides,
});

describe('domainMatches', () => {
  it('matches a host-only cookie against exactly its own host', () => {
    expect(domainMatches(cookie({ domain: 'kabin.intern.dev.nav.no' }), 'kabin.intern.dev.nav.no')).toBe(true);
  });

  it('does not match a host-only cookie against a subdomain of its host', () => {
    expect(domainMatches(cookie({ domain: 'nav.no' }), 'kabin.intern.dev.nav.no')).toBe(false);
  });

  it('does not match a host-only cookie against a parent domain', () => {
    expect(domainMatches(cookie({ domain: 'kabin.intern.dev.nav.no' }), 'nav.no')).toBe(false);
  });

  it('does not match a host-only cookie against an unrelated host', () => {
    expect(domainMatches(cookie({ domain: 'kabin.intern.dev.nav.no' }), 'login.microsoftonline.com')).toBe(false);
  });

  it('matches a domain cookie against the domain itself, without the leading dot', () => {
    expect(domainMatches(cookie({ domain: '.nav.no' }), 'nav.no')).toBe(true);
  });

  it('matches a domain cookie against any subdomain', () => {
    expect(domainMatches(cookie({ domain: '.nav.no' }), 'kabin.intern.dev.nav.no')).toBe(true);
  });

  it('does not match a domain cookie against a host that merely ends with the same characters', () => {
    expect(domainMatches(cookie({ domain: '.nav.no' }), 'ikkenav.no')).toBe(false);
  });

  it('does not match a domain cookie against an unrelated host', () => {
    expect(domainMatches(cookie({ domain: '.nav.no' }), 'login.microsoftonline.com')).toBe(false);
  });

  // `URL` lower cases the hostname and the browser lower cases the cookie domain (RFC 6265 § 5.2.3),
  // so a case-sensitive comparison is enough for the input we actually get.
  it('compares case sensitively', () => {
    expect(domainMatches(cookie({ domain: 'NAV.no' }), 'nav.no')).toBe(false);
  });
});

describe('pathMatches', () => {
  it('matches an identical path', () => {
    expect(pathMatches(cookie({ path: '/kabin/api' }), '/kabin/api')).toBe(true);
  });

  it('matches any path when the cookie path is the root path', () => {
    expect(pathMatches(cookie({ path: '/' }), '/kabin/api/registreringer')).toBe(true);
  });

  it('matches the root path itself when the cookie path is the root path', () => {
    expect(pathMatches(cookie({ path: '/' }), '/')).toBe(true);
  });

  it('matches a subpath of the cookie path', () => {
    expect(pathMatches(cookie({ path: '/kabin' }), '/kabin/api/registreringer')).toBe(true);
  });

  it('matches a subpath when the cookie path has a trailing slash', () => {
    expect(pathMatches(cookie({ path: '/kabin/' }), '/kabin/api')).toBe(true);
  });

  it('does not match a path that only shares a prefix with the cookie path', () => {
    expect(pathMatches(cookie({ path: '/kabin' }), '/kabinett')).toBe(false);
  });

  it('does not match a parent of the cookie path', () => {
    expect(pathMatches(cookie({ path: '/kabin/api' }), '/kabin')).toBe(false);
  });

  it('does not match the cookie path without its trailing slash', () => {
    expect(pathMatches(cookie({ path: '/kabin/' }), '/kabin')).toBe(false);
  });

  it('does not match an unrelated path', () => {
    expect(pathMatches(cookie({ path: '/kabin' }), '/kabal/api')).toBe(false);
  });
});

describe('secureMatches', () => {
  it('sends a secure cookie over https', () => {
    expect(secureMatches(cookie({ secure: true }), 'https:')).toBe(true);
  });

  it('does not send a secure cookie over http', () => {
    expect(secureMatches(cookie({ secure: true }), 'http:')).toBe(false);
  });

  it('sends a non-secure cookie over https', () => {
    expect(secureMatches(cookie({ secure: false }), 'https:')).toBe(true);
  });

  it('sends a non-secure cookie over http', () => {
    expect(secureMatches(cookie({ secure: false }), 'http:')).toBe(true);
  });
});

describe('appliesTo', () => {
  const url = new URL('https://kabin.intern.dev.nav.no/api/registreringer/123');

  it('applies when domain, path and protocol all match', () => {
    const applicable = cookie({ domain: 'kabin.intern.dev.nav.no', path: '/api', secure: true });

    expect(appliesTo(applicable, url)).toBe(true);
  });

  it('applies to a domain cookie set on a parent domain', () => {
    const applicable = cookie({ domain: '.nav.no', path: '/', secure: true });

    expect(appliesTo(applicable, url)).toBe(true);
  });

  it('does not apply when the domain does not match', () => {
    const azureCookie = cookie({ domain: 'login.microsoftonline.com', path: '/', secure: true });

    expect(appliesTo(azureCookie, url)).toBe(false);
  });

  it('does not apply when the path does not match', () => {
    const wrongPath = cookie({ domain: 'kabin.intern.dev.nav.no', path: '/kabal', secure: true });

    expect(appliesTo(wrongPath, url)).toBe(false);
  });

  it('does not apply when a secure cookie is sent over http', () => {
    const secureCookie = cookie({ domain: 'kabin.intern.dev.nav.no', path: '/', secure: true });

    expect(appliesTo(secureCookie, new URL('http://kabin.intern.dev.nav.no/api/registreringer/123'))).toBe(false);
  });

  it('applies to a non-secure cookie sent over http', () => {
    const insecureCookie = cookie({ domain: 'kabin.intern.dev.nav.no', path: '/', secure: false });

    expect(appliesTo(insecureCookie, new URL('http://kabin.intern.dev.nav.no/api/registreringer/123'))).toBe(true);
  });

  it('ignores the port when matching the domain', () => {
    const localCookie = cookie({ domain: 'localhost', path: '/', secure: false });

    expect(appliesTo(localCookie, new URL('http://localhost:8080/api/registreringer'))).toBe(true);
  });

  it('ignores the query string when matching the path', () => {
    const applicable = cookie({ domain: 'kabin.intern.dev.nav.no', path: '/api', secure: true });

    expect(appliesTo(applicable, new URL('https://kabin.intern.dev.nav.no/api?id=123'))).toBe(true);
  });
});
