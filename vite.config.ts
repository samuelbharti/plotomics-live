import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Build a single IIFE bundle into www/app.js. React/ReactDOM are *externalized*
// and pulled from window.shinyreact at runtime so this bundle shares the one
// React instance that owns the shinyreact hooks (the duplicate-React pitfall).
export default defineConfig({
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  plugins: [react()],
  build: {
    outDir: "www",
    emptyOutDir: false,
    cssCodeSplit: false,
    target: "es2020",
    lib: {
      entry: path.resolve(__dirname, "srcts/main.tsx"),
      formats: ["iife"],
      name: "BioViz",
      fileName: () => "app.js",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react-dom/client"],
      output: {
        globals: {
          react: "window.shinyreact.React",
          "react-dom": "window.shinyreact.ReactDOM",
          "react-dom/client": "window.shinyreact.ReactDOM",
        },
      },
    },
  },
});
