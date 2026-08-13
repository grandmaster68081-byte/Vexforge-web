import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

function sourceCommit(): string {
  const configuredCommit =
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.COMMIT_SHA;

  if (configuredCommit) return configuredCommit;

  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

function buildProvenancePlugin() {
  let outputPath = "";

  return {
    name: "vexforge-build-provenance",
    apply: "build" as const,
    configResolved(config: { root: string; build: { outDir: string } }) {
      outputPath = resolve(config.root, config.build.outDir);
    },
    writeBundle() {
      writeFileSync(
        resolve(outputPath, "build-manifest.json"),
        `${JSON.stringify(
          {
            schemaVersion: 1,
            project: "VEXFORGE",
            sourceCommit: sourceCommit(),
            sourceBranch:
              process.env.CF_PAGES_BRANCH ||
              process.env.GITHUB_REF_NAME ||
              "main",
            outputDirectory: "dist",
          },
          null,
          2,
        )}\n`,
      );
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), buildProvenancePlugin()],
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
