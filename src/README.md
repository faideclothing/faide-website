# FAIDE Source Structure

This repository now separates **authoring code** (`src/`) from **served output** (`public/`) so the live site design stays unchanged while code is easier to maintain.

## Folder mapping

- `src/pages/` → page templates (currently `index.html`)
- `src/styles/` → stylesheet source files (currently `main.css`)
- `src/scripts/` → front-end logic (currently `app.js`)
- `src/data/` → structured content data (currently `products.json`)
- `public/` → deployable/static output used by `npm run dev`

## Current mirrored files

- `src/pages/index.html` mirrors `public/index.html`
- `src/styles/main.css` mirrors `public/assets/css/style.css`
- `src/scripts/app.js` mirrors `public/assets/js/app.js`
- `src/data/products.json` mirrors `public/assets/js/products.json`

## Sync workflow

Use the helper script to copy source files to public output:

```bash
bash scripts/sync-src-to-public.sh
```

This keeps the website design and behavior intact while letting you edit code in organized folders.
