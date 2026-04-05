#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SYNC_PAIRS=(
  "src/pages/index.html:public/index.html"
  "src/pages/privacy.html:public/privacy.html"
  "src/pages/shipping.html:public/shipping.html"
  "src/pages/terms.html:public/terms.html"
  "src/pages/returns.html:public/returns.html"
  "src/styles/main.css:public/assets/css/style.css"
  "src/scripts/app.js:public/assets/js/app.js"
  "src/data/products.json:public/assets/js/products.json"
)

for pair in "${SYNC_PAIRS[@]}"; do
  src_rel="${pair%%:*}"
  dst_rel="${pair##*:}"

  src="$ROOT_DIR/$src_rel"
  dst="$ROOT_DIR/$dst_rel"

  if [[ ! -f "$src" ]]; then
    echo "Missing required source file: $src_rel" >&2
    exit 1
  fi

  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
done

echo "Synced src -> public successfully."
