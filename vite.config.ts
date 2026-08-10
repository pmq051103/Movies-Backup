import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
    // Triple-API proxy to bypass CORS in dev:
    //   /api    → phimapi.com (primary — large catalog)
    //   /api2   → vsmov.com/api (secondary — fresh Vietnamese titles)
    //   /api3   → ophim1.com (tertiary — extra catalog + earliest updates)
    // In production, vercel.json / netlify.toml mirror these rewrites.
    proxy: {
      "/api2": {
        target: "https://vsmov.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api2/, "/api"),
      },
      "/api3": {
        target: "https://ophim1.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api3/, ""),
      },
      "/api": {
        target: "https://phimapi.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  preview: {
    port: 3000,
    proxy: {
      "/api2": {
        target: "https://vsmov.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api2/, "/api"),
      },
      "/api3": {
        target: "https://ophim1.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api3/, ""),
      },
      "/api": {
        target: "https://phimapi.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
