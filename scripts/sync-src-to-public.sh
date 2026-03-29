#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cp "$ROOT_DIR/src/pages/index.html" "$ROOT_DIR/public/index.html"
cp "$ROOT_DIR/src/styles/main.css" "$ROOT_DIR/public/assets/css/style.css"
cp "$ROOT_DIR/src/scripts/app.js" "$ROOT_DIR/public/assets/js/app.js"
cp "$ROOT_DIR/src/data/products.json" "$ROOT_DIR/public/assets/js/products.json"

echo "Synced src -> public successfully."
