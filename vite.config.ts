import { defineConfig } from "vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc"; // SWC is faster than Babel
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
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          // framer-motion
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-motion";
          }
          // tanstack
          if (id.includes("node_modules/@tanstack")) {
            return "vendor-router";
          }
          // redux
          if (id.includes("node_modules/@reduxjs") || id.includes("node_modules/react-redux")) {
            return "vendor-redux";
          }
          // lucide (tree-shakeable but still large)
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
        },
      },
    },
    minify: "esbuild",
    cssCodeSplit: true,
    sourcemap: false,
    target: "es2020",
    // Compress assets
    assetsInlineLimit: 4096, // inline assets < 4KB
  },
  optimizeDeps: {
    include: ["react", "react-dom", "framer-motion", "@tanstack/react-router", "@reduxjs/toolkit", "react-redux"],
  },
});
