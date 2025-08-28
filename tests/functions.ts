export const USE_LOCALHOST = process.env.TARGET === 'local';

export const LOCAL_DOMAIN = 'http://localhost:8063';
export const DEV_DOMAIN = 'https://kabin.intern.dev.nav.no';

export const UI_DOMAIN = USE_LOCALHOST ? LOCAL_DOMAIN : DEV_DOMAIN;

export const KABAL_DEV_DOMAIN = 'https://kabal.intern.dev.nav.no';
