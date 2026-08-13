# Apache Fory Site: System Understanding (Agent View)

## 1. Project Positioning

This repository contains the Apache Fory website and documentation site source (Docusaurus).  
It is not the Fory core serialization library itself.

Primary responsibilities:

- Official homepage and marketing content (`src/pages` + custom components)
- Documentation (multi-version, multi-language)
- Blog
- Community, download, and related pages

Core objective: stable static site publishing plus high-quality documentation and Chinese localization maintenance.

## 2. Tech Stack and Runtime

- Framework: Docusaurus 3 (React 18 + TypeScript)
- Styling and motion: CSS Modules, Tailwind (partial usage), AOS, Framer Motion
- Search: `docusaurus-lunr-search`
- Node requirement: `>=18`

Common commands (`package.json`):

- `npm run start` / `npm run start-en` / `npm run start-zh`
- `npm run build` (runs `prebuild` first)
- `npm run docusaurus docs:version <ver>` (wrapped command with i18n version copy support)

Agent command restriction:

- Do not execute `npm run typecheck` unless the user explicitly reverses this
  instruction. Use the permitted build and focused checks for validation.

## 3. Information Architecture and Directory Responsibilities

Key directories:

- `docs/`: current docs (current/dev)
- `versioned_docs/version-*/`: historical docs by version
- `versioned_sidebars/`: sidebars for versioned docs
- `i18n/zh-CN/docusaurus-plugin-content-docs/`: Chinese docs (`current` + `version-*`)
- `blog/`: blog content
- `src/pages/`: homepage, users page, download page, security page, etc.
- `src/theme/`: Docusaurus theme overrides (notably blog rendering behavior)
- `src/plugin/redirect.js`: site redirect logic
- `scripts/`: docs versioning and i18n helper scripts
- `.github/workflows/`: CI/CD pipelines

Current docs footprint (rough file count):

- `docs/`: 158
- `versioned_docs/`: 333
- `i18n/zh-CN/docusaurus-plugin-content-docs/`: 500

## 4. Docs Versioning Strategy

- `versions.json` currently includes: `0.15, 0.14, 0.13, 0.12, 0.11, 0.10`
- In `docusaurus.config.ts`, `docs.lastVersion = "0.15"`
- The current docs label is `dev` (`current`)

Recommended versioning entry point:

- Use `npm run docusaurus docs:version <ver>`
- This invokes `scripts/docusaurus-with-i18n.sh`
- After native Docusaurus versioning, the wrapper copies each locale’s `current/` to `version-<ver>/`

## 5. Internationalization (i18n) Mechanism

Enabled locales:

- `en-US` (default)
- `zh-CN`

Chinese docs paths:

- `i18n/zh-CN/docusaurus-plugin-content-docs/current/`
- `i18n/zh-CN/docusaurus-plugin-content-docs/version-*/`

Chinese top-level sidebar labels are managed in:

- `i18n/zh-CN/docusaurus-plugin-content-docs/current.json`

Prebuild step:

- `scripts/copy-i18n-fallback.sh`
- It fills missing Chinese files for `specification` and `benchmarks` from English sources (`rsync --ignore-existing`) to prevent broken links

This means Chinese docs may be a mix of translated content and English fallback files.

## 6. Site Customization (vs. Default Docusaurus Behavior)

- The homepage is composed of custom sections (Hero, Features, language cards, code carousel)
- `src/plugin/redirect.js` has built-in redirects:
  - `fury.apache.org` -> `fory.apache.org`
  - Old routes `/docs/.../docs/{guide|introduction|start}` -> cleaned routes
- Blog theme overrides:
  - List pages prefer frontmatter `description` as summary
  - Post detail pages remove the global blog sidebar for a focused reading layout

## 7. CI/CD and Quality Gates

### CI

- `lint.yml`
  - Markdown lint (`markdownlint-cli`)
  - YAML lint (`yamllint`)
- `link-check.yml`
  - Workflow exists, but link-check steps are currently commented out (not effectively running)

### CD

- `deploy.yml`
  - Runs on push to `main` and on pull requests
  - Calls `scripts/unified-docs/script.py`
  - Runs `npm run download-avatars` + `npm run build`
  - Publishes to `deploy` branch for non-PR events (`peaceiris/actions-gh-pages`)

## 8. Key Repository Caveats

- `CONTRIBUTING.md` states that `docs/guide` and `docs/specification` are mainly synced from `apache/fory`.  
  For those sections, confirm whether changes should go to the main `apache/fory` repo instead.
- Do not run benchmarks during `fory-site` release, documentation, or blog work.
  Use existing benchmark reports, data, and figures checked into the relevant
  documentation as the source of truth. Run or regenerate a benchmark only
  when the user explicitly asks for a benchmark run.
- Do not use subagents for `fory-site` work unless the user explicitly asks for
  subagent delegation. Keep implementation, validation, and review in the main
  task by default.
- `scripts/unified-docs/script.py` uses `i18n/eu-US/...` paths (not `en-US`); treat this as existing behavior and validate intent before changing.
- Since link-check is not effectively active, external link regressions may pass PR checks.
- The repo has substantial versioned/mirrored docs; avoid accidental bulk edits in `versioned_docs` and `i18n/version-*`.

## 9. Recommended Agent Workflow

- Before editing docs, scope the target explicitly:
  - `docs/current`
  - `versioned_docs/version-*`
  - `i18n/zh-CN/current`
  - `i18n/zh-CN/version-*`
- For Chinese translation tasks:
  - Follow `skills/translate-docs-zh/SKILL.md`
  - Use terminology from `skills/translate-docs-zh/references/terminology.md`
  - Do not use external translation tools/APIs/websites
- When changing top-level sidebar categories (Introduction/Start/Schema IDL & Compiler/Guide):
  - Update `sidebars.ts`
  - Update `i18n/zh-CN/docusaurus-plugin-content-docs/current.json` (and version JSON files if needed)
- Minimum pre-commit validation:
  - `npm run build`
  - Manually verify critical routes: `/`, `/docs`, `/zh-CN/docs`, `/blog`
