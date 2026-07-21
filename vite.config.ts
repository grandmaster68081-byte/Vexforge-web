import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    // Disable sourcemaps in production — reduces bundle size
    sourcemap: false,
    minify: "esbuild",
    // Warn only for chunks > 600 kB (default 500)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split vendor code into separate chunks for better caching
        manualChunks: {
          // React core — rarely changes; cache for a long time
          "vendor-react": ["react", "react-dom"],
          // Router — changes less often than app code
          "vendor-router": ["react-router-dom"],
          // Supabase client — large, but stable
          "vendor-supabase": ["@supabase/supabase-js"],
        },
        // Put CSS and assets into organized folders
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
  // Ensure the dev server allows Replit proxy hosts
  server: {
    allowedHosts: true,
    port: Number(process.env.PORT) || 5173,
  },
  preview: {
    port: Number(process.env.PORT) || 4173,
  },
});
