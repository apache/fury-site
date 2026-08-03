#!/bin/bash
# Copy fallback folders from English docs to Chinese i18n.
# This ensures links to shared docs files work in Chinese docs.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ZH_CN_DOCS="$ROOT_DIR/i18n/zh-CN/docusaurus-plugin-content-docs"

copy_fallback_file() {
  local source_file="$1"
  local target_file="$2"
  local target_relative="${target_file#"$ROOT_DIR/"}"

  # A tracked target is an authored translation and remains authoritative.
  # Generated, ignored fallback files are refreshed on every build so they
  # cannot retain stale content after the English source changes.
  if git -C "$ROOT_DIR" ls-files --error-unmatch -- "$target_relative" >/dev/null 2>&1; then
    return
  fi

  mkdir -p "$(dirname "$target_file")"
  cp -p "$source_file" "$target_file"
}

copy_fallback_folder() {
  local source_folder="$1"
  local target_folder="$2"

  while IFS= read -r -d '' source_file; do
    local relative_path="${source_file#"$source_folder/"}"
    copy_fallback_file "$source_file" "$target_folder/$relative_path"
  done < <(find "$source_folder" -type f -print0)
}

copy_current_folder_to_zh() {
  local folder_name="$1"

  echo "Copying current $folder_name docs to Chinese i18n..."

  if [ -d "$ROOT_DIR/docs/$folder_name" ]; then
    local current_target="$ZH_CN_DOCS/current/$folder_name"
    mkdir -p "$current_target"
    copy_fallback_folder "$ROOT_DIR/docs/$folder_name" "$current_target"
    echo "  Synced missing docs/$folder_name -> current/$folder_name"
  fi
}

copy_versioned_folder_to_zh() {
  local folder_name="$1"

  echo "Copying versioned $folder_name docs to Chinese i18n..."

  for version_dir in "$ROOT_DIR/versioned_docs"/version-*; do
    if [ -d "$version_dir/$folder_name" ]; then
      local version
      version=$(basename "$version_dir")
      local version_target="$ZH_CN_DOCS/$version/$folder_name"
      mkdir -p "$version_target"
      copy_fallback_folder "$version_dir/$folder_name" "$version_target"
      echo "  Synced missing versioned_docs/$version/$folder_name -> $version/$folder_name"
    fi
  done
}

for folder_name in \
  introduction \
  start \
  benchmarks \
  object-serialization \
  row-format \
  json \
  compiler \
  grpc \
  development \
  specification; do
  copy_current_folder_to_zh "$folder_name"
done

copy_versioned_folder_to_zh "specification"
copy_versioned_folder_to_zh "benchmarks"

if [ -f "$ROOT_DIR/docs/index.md" ]; then
  copy_fallback_file "$ROOT_DIR/docs/index.md" "$ZH_CN_DOCS/current/index.md"
fi

echo "Done copying fallback folders."
