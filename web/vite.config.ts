import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// gh-pages serves the repo at /IntelliCart/
const base = process.env.VITE_BASE ?? "/IntelliCart/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  // `npm run dev` / `npm run preview` land on the admin sign-in; the storefront is at the base URL.
  server: { open: `${base}admin/` },
  preview: { open: `${base}admin/` },
  build: {
    rollupOptions: {
      input: {
        shop: "index.html",
        admin: "admin/index.html",
      },
    },
  },
});
