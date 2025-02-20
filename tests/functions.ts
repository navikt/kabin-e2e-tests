export const USE_DEV = process.env.NODE_ENV === 'test';

export const LOCAL_DOMAIN = 'http://localhost:8063';

export const DEV_DOMAIN = 'https://kabin.intern.dev.nav.no';
export const UI_DOMAIN = USE_DEV ? DEV_DOMAIN : LOCAL_DOMAIN;

export const KABAL_LOCAL_DOMAIN = 'http://localhost:8061';
export const KABAL_DEV_DOMAIN = 'https://kabal.intern.dev.nav.no';
export const KABAL_UI_DOMAIN = USE_DEV ? KABAL_DEV_DOMAIN : KABAL_LOCAL_DOMAIN;
