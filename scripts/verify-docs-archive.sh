#!/usr/bin/env bash

set -euo pipefail

ARCHIVE_ROOT="${1:-build}"
ARCHIVED_VERSIONS=(0.10 0.11 0.12 0.13 0.14 0.15 0.16 0.17)

if [ ! -d "$ARCHIVE_ROOT/assets" ]; then
  echo "Archive assets directory is missing: $ARCHIVE_ROOT/assets" >&2
  exit 1
fi

total_pages=0
for version in "${ARCHIVED_VERSIONS[@]}"; do
  for docs_root in \
    "$ARCHIVE_ROOT/docs/$version" \
    "$ARCHIVE_ROOT/zh-CN/docs/$version"; do
    if [ ! -d "$docs_root" ]; then
      echo "Archived docs directory is missing: $docs_root" >&2
      exit 1
    fi

    page_count=$(find "$docs_root" -type f -name '*.html' | wc -l | tr -d ' ')
    if [ "$page_count" -eq 0 ]; then
      echo "Archived docs directory has no HTML pages: $docs_root" >&2
      exit 1
    fi
    total_pages=$((total_pages + page_count))
  done
done

# Archive pages must never depend on the mutable root-level asset hashes from
# the current site. Keeping this invariant makes the one-time output portable.
if rg -l "(href|src)=['\"]?/assets/" "$ARCHIVE_ROOT" --glob '*.html' >/dev/null; then
  echo "Archive HTML contains root-level /assets/ references" >&2
  rg -l "(href|src)=['\"]?/assets/" "$ARCHIVE_ROOT" --glob '*.html' | head -n 20 >&2
  exit 1
fi

if ! rg -l '/archive/assets/' "$ARCHIVE_ROOT" --glob '*.html' >/dev/null; then
  echo "Archive HTML does not reference namespaced /archive/assets/ files" >&2
  exit 1
fi

echo "Verified $total_pages archived HTML pages in $ARCHIVE_ROOT"
