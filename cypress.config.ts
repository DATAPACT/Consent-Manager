import { defineConfig } from "cypress";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },

  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    watchForFileChanges: true,
    setupNodeEvents(on, config) {
      config.env.requester_email = process.env.CYPRESS_REQUESTER_EMAIL;
      config.env.requester_password = process.env.CYPRESS_REQUESTER_PASSWORD;
      config.env.provider_email = process.env.CYPRESS_PROVIDER_EMAIL;

      return config;
    }
  },
});
