import { defineConfig } from 'playwright/test';
import { baseConfig } from './playwright.config.base';

// biome-ignore lint/style/noDefaultExport: https://playwright.dev/docs/test-configuration#basic-configuration
export default defineConfig({
  ...baseConfig,
  maxFailures: 1,

  use: {
    ...baseConfig.use,
    storageState: './state.json',
  },
});
