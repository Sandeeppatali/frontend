import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  // Add these for proper deployment
  base: "./", // Ensures assets use relative paths
  build: {
    outDir: "dist", // Output directory
    assetsDir: "assets", // Assets subdirectory
    sourcemap: false, // Disable sourcemaps for production (optional)
    rollupOptions: {
      output: {
        manualChunks: undefined // Prevents chunk splitting issues
      }
    }
  },
  // Handle SPA routing for development
  preview: {
    port: 4173,
    host: true // Allow external access
  }
});