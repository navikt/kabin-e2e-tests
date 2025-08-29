import { defineConfig } from 'playwright/test';

const baseConfig = defineConfig({
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

// Config for running tests locally
const local = defineConfig({
  ...baseConfig,
  maxFailures: 1,

  use: {
    ...baseConfig.use,
    storageState: './state.json',
  },
});

// Config for running tests in NAIS
const nais = defineConfig({
  ...baseConfig,
  outputDir: '/tmp/test-results',
  reporter: [['list'], ['./reporters/slack-reporter.ts'], ['./reporters/status.ts']],
  retries: 1,

  use: {
    ...baseConfig.use,
    video: 'on',
    screenshot: 'on',
    storageState: '/tmp/state.json',
  },
});

const config = process.env.CONFIG === 'nais' ? nais : local;

export default config;
