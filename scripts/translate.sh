#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
I18N_DIR="$SCRIPT_DIR/../src/app/assets/i18n"

if [ ! -f "$I18N_DIR/en.json" ]; then
  echo "Error: i18n directory not found or missing en.json: $I18N_DIR"
  exit 1
fi

cd "$I18N_DIR"

LANGS=(ar de es fr hi it ja ko nl pl pt ru sv th tr vi)

for lang in "${LANGS[@]}"; do
  echo "Translating en -> $lang..."
  i18n-auto-translation -a deepl-pro -k ae6dab27-2eb1-2ddd-17d2-1193f0af3391 -d . -f en -t "$lang"
done

echo "Done."
