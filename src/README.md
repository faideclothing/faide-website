# FAIDE Source Structure

The repository keeps **authoring code** in `src/` and publishes runnable output in `public/`.

## Folder route map

- `src/pages/` → page templates (`public/*.html`)
- `src/styles/` → styles (`public/assets/css/*`)
- `src/scripts/` → browser logic (`public/assets/js/*`)
- `src/data/` → structured content (`public/assets/js/products.json`)
- `src/components/` → reusable page fragments organized by feature
- `src/assets/` → source images/icons/fonts
- `src/tests/` → automated test files

Every source folder now includes at least one tracked file (`README.md` or code/data file), so no folders are empty in GitHub.

## Current mirrored files

- `src/pages/index.html` → `public/index.html`
- `src/pages/404.html` → `public/404.html`
- `src/pages/robots.txt` → `public/robots.txt`
- `src/pages/sitemap.xml` → `public/sitemap.xml`
- `src/styles/main.css` → `public/assets/css/style.css`
- `src/scripts/app.js` → `public/assets/js/app.js`
- `src/data/products.json` → `public/assets/js/products.json`

## Sync workflow

```bash
bash scripts/sync-src-to-public.sh
```

The sync script validates required source files and creates target directories before copying.
