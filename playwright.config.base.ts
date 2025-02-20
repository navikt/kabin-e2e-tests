import { defineConfig } from 'playwright/test';

export const baseConfig = defineConfig({
  name: 'Kabin',
  testDir: './tests',
  fullyParallel: true,
  timeout: 120_000,
  globalTimeout: 360_000,
  globalSetup: require.resolve('./setup/global-setup'),

  use: {
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: 'on',
    locale: 'no-NB',
    storageState: '/tmp/state.json',
  },
});
