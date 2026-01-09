import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
   base: '/consent-manager/',
   server: {
    host: true, // Expose to local network (e.g. tablet)
    allowedHosts: ["dips.soton.ac.uk"],
    headers: {
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': 'frame-ancestors *',
    },
  },
});
