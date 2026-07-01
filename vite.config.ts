import { defineConfig } from "vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsConfigPaths(),
  ],
  resolve: {
    alias: { "@": "/src" },
  },
  build: {
    // Raise chunk warning limit
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core — almost never changes
          "vendor-react": ["react", "react-dom"],
          // Router + query — stable
          "vendor-router": ["@tanstack/react-router", "@tanstack/react-query"],
          // Animation — heavy, lazy-loaded
          "vendor-motion": ["framer-motion"],
          // Redux
          "vendor-redux": ["@reduxjs/toolkit", "react-redux"],
          // Sonner toasts
          "vendor-ui": ["sonner"],
        },
      },
    },
    // Enable minification
    minify: "esbuild",
    // CSS code splitting
    cssCodeSplit: true,
    // Sourcemaps off in prod
    sourcemap: false,
    // Target modern browsers
    target: "es2020",
  },
  // Optimize deps
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "framer-motion",
      "@tanstack/react-router",
      "@reduxjs/toolkit",
      "react-redux",
    ],
  },
});
