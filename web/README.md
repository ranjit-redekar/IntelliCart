# IntelliCart Web (Vite + React + TypeScript)

One Vite app, two entries: the storefront at `/` and the operator console at `/admin/`.

```
index.html        → src/shop/main.tsx    (storefront)
admin/index.html  → src/admin/main.tsx   (admin console)
src/index.css     → design tokens + utilities, shared by both
```

## Run

```bash
npm install
npm run dev       # http://localhost:5173/IntelliCart/  ·  admin at /IntelliCart/admin/
npm run build     # dist/index.html + dist/admin/index.html
npm run preview
```

`base` is `/IntelliCart/` for GitHub Pages; override with `VITE_BASE=/ npm run build` for another host.
Both entries use `HashRouter`, so deep links work on static hosts without rewrite rules.
