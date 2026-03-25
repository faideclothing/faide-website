# FAIDE Professional E-Commerce Structure

This scaffold is added to make ongoing edits cleaner and more maintainable.

## Recommended organization
- `src/components/` reusable UI units by domain (auth, cart, checkout, lookbook, product)
- `src/pages/` page-level entry templates
- `src/styles/` layered CSS: base, components, pages, utilities
- `src/scripts/` modular JavaScript split into core bootstrapping, modules, services, and utilities
- `src/data/` editable data/content sources
- `src/config/` environment and feature flags
- `src/tests/` future test suites
- `src/assets/` static media grouped by type

## Suggested next migration steps
1. Move `public/assets/js/app.js` into `src/scripts/modules/` by feature.
2. Move `public/assets/css/style.css` into `src/styles/` partial files.
3. Keep build output in `public/` and authoring source in `src/`.
