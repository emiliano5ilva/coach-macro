import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  // Prevent Vite from pre-bundling mapbox-gl — it loads its own worker at runtime
  // via blob URLs and esbuild pre-bundling breaks that internal worker mechanism.
  optimizeDeps: {
    exclude: ["mapbox-gl"],
  },
  build: {
    rollupOptions: {
      external: ["@capacitor-community/in-app-review"],
    },
  },
});
