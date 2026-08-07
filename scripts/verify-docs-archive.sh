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
# the current site. Use Python for this scan because GitHub's runner image does
# not guarantee that ripgrep is installed.
python3 - "$ARCHIVE_ROOT" <<'PY'
import re
import sys
from pathlib import Path

archive_root = Path(sys.argv[1])
unexpected_versions = []
for docs_root in (archive_root / "docs", archive_root / "zh-CN" / "docs"):
    for child in docs_root.iterdir():
        if child.is_dir() and (
            child.name == "next" or re.fullmatch(r"1[.]\d+[.]\d+", child.name)
        ):
            unexpected_versions.append(str(child))

if unexpected_versions:
    print("Archive contains current or 1.x docs:", file=sys.stderr)
    for path in unexpected_versions:
        print(path, file=sys.stderr)
    raise SystemExit(1)

root_asset_pattern = re.compile(r'''(?:href|src)=["']?/assets/''')
root_asset_pages = []
has_archive_assets = False
for html_path in archive_root.rglob("*.html"):
    html = html_path.read_text(encoding="utf-8", errors="ignore")
    if root_asset_pattern.search(html):
        root_asset_pages.append(str(html_path))
    if "/archive/assets/" in html:
        has_archive_assets = True

if root_asset_pages:
    print("Archive HTML contains root-level /assets/ references:", file=sys.stderr)
    for path in root_asset_pages[:20]:
        print(path, file=sys.stderr)
    raise SystemExit(1)

if not has_archive_assets:
    print(
        "Archive HTML does not reference namespaced /archive/assets/ files",
        file=sys.stderr,
    )
    raise SystemExit(1)
PY

echo "Verified $total_pages archived HTML pages in $ARCHIVE_ROOT"
