import { defineConfig } from 'playwright/test';
import { baseConfig } from './playwright.config.base';

export default defineConfig({
  ...baseConfig,
  maxFailures: 1,

  use: {
    ...baseConfig.use,
    storageState: './state.json',
  },
});
