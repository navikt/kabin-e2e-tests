import { defineConfig } from 'playwright/test';

const isInNais = process.env.CONFIG === 'nais';

export const storageState = isInNais ? '/tmp/state.json' : './state.json';

const baseConfig = defineConfig({
  name: 'Kabin',
  timeout: 120_000,
  globalTimeout: 360_000,
  globalSetup: './setup/global-setup.ts',
  globalTeardown: './setup/global-teardown.ts',

  testDir: './tests',
  testMatch: '**/*.test.ts',
  fullyParallel: true,

  use: {
    locale: 'no-NB',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    storageState,
  },
});

const local = defineConfig({
  ...baseConfig,

  maxFailures: 1,
  outputDir: './test-results',
  reporter: [['list']],
  retries: 0,

  use: {
    ...baseConfig.use,

    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
});

const nais = defineConfig({
  ...baseConfig,

  maxFailures: 0,
  outputDir: '/tmp/test-results',
  reporter: [['list'], ['./reporters/slack-reporter.ts'], ['./reporters/status.ts']],
  retries: 1,

  use: {
    ...baseConfig.use,

    trace: 'on',
    video: 'on',
    screenshot: 'on',
  },
});

export default isInNais ? nais : local;
