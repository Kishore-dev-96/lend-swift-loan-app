import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      require('@cypress/vite-dev-server').setup(on, config);
      return config;
    },
  },
});
