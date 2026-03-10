#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_ICON="$ROOT_DIR/assets/icon.png"
TARGETS=(
  "$ROOT_DIR/ios/PillMind/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png"
)

if [[ ! -f "$SOURCE_ICON" ]]; then
  echo "source icon not found: $SOURCE_ICON" >&2
  exit 1
fi

for target in "${TARGETS[@]}"; do
  cp "$SOURCE_ICON" "$target"
done

for file in "$SOURCE_ICON" "${TARGETS[@]}"; do
  if ! sips -g hasAlpha "$file" | grep -q "hasAlpha: no"; then
    echo "icon file must not contain alpha channel: $file" >&2
    exit 1
  fi
done

SOURCE_HASH="$(shasum -a 256 "$SOURCE_ICON" | awk '{print $1}')"

for target in "${TARGETS[@]}"; do
  TARGET_HASH="$(shasum -a 256 "$target" | awk '{print $1}')"
  if [[ "$TARGET_HASH" != "$SOURCE_HASH" ]]; then
    echo "icon sync hash mismatch: $target" >&2
    exit 1
  fi
done

echo "ios app icon sync ok"
