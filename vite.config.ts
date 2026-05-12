import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
  plugins: [react()],
   base: '/consent-manager/',
   build: { sourcemap: true },
   server: {
    host: true, // Expose to local network (e.g. tablet)
    allowedHosts: ["dips.soton.ac.uk"],
    headers: {
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': 'frame-ancestors *',
    },
  },
  define: {
    __APP_ENV__: env.APP_ENV,
  }
};
});
