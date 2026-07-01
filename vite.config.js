import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Satellite map tiles — already in use by RoofPolygonDrawer
      "/api/staticmap": {
        target: "https://maps.googleapis.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/staticmap/, "/maps/api/staticmap"),
      },

      // Google Solar API — proxied to avoid CORS
      // Usage in code: fetch(`/api/solar/buildingInsights:findClosest?...`)
      "/api/solar": {
        target: "https://solar.googleapis.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/solar/, "/v1"),
      },
    },
  },
});