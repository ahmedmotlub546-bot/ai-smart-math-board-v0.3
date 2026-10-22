import { defineConfig } from "vite";

export default defineConfig({
  base: "./", // relative paths so the same build works on a web host and inside the Android app
  server: {
    port: 5173,
    host: true,
    proxy: { "/api": { target: "http://localhost:8787", changeOrigin: true } }
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2020", // runs on older Android WebViews
    chunkSizeWarningLimit: 700
  }
});
