import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // gh-pages serves the repo at /IntelliCart/
  base: process.env.VITE_BASE ?? "/IntelliCart/",
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        shop: "index.html",
        admin: "admin/index.html",
      },
    },
  },
});
