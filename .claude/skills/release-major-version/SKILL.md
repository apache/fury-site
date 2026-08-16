---
name: release-major-version
description: >-
  Prepare the Apache Fory site for a release that opens a new documentation
  line, such as 0.17.0 or 1.6.0:
  write the release blog, update the download page, checkpoint with git
  commits, translate the zh-CN release blog and docs, create the versioned
  docs snapshot, update the default docs version, and run an independent
  self-review to catch remaining issues. Use only when the release requires a
  new Docusaurus versioned-docs snapshot. Do not use for patch releases such
  as 1.6.1 that update an existing documentation line.
---

# Release Big Version

Use this skill for the `apache/fory-site` repository only when preparing a
release that opens a new documentation line and therefore requires a new
Docusaurus snapshot, such as `0.17.0` or `1.6.0`.

This skill is for the website/docs repository workflow, not the ASF source release/signing workflow in `docs/community/how_to_release.md`.

## Applicability Boundary

Use this workflow when all of the following are true:

1. The release starts a new maintained documentation line.
2. The site must create `versioned_docs/version-<version>/` and the matching
   localized snapshot.
3. The target version must be added to `versions.json` and become
   `docs.lastVersion`.

Do **not** use this workflow for a patch release such as `1.6.1` when the site
already has the corresponding `1.6.0` documentation line. For a patch release:

1. Write the release blog and update the homepage, download pages, current
   install guidance, and other release-facing references as needed.
2. Apply release-relevant documentation fixes and version pins directly to the
   existing English and zh-CN versioned trees, for example
   `versioned_docs/version-1.6.0/` and
   `i18n/zh-CN/docusaurus-plugin-content-docs/version-1.6.0/` for `1.6.1`.
3. Keep the existing documentation line name and navigation entry.
4. Do not run `docusaurus docs:version`, create a patch-version sidebar or
   localized version metadata, add the patch version to `versions.json`, or
   change `docs.lastVersion`.

If the request does not clearly establish whether the release opens a new docs
line, inspect `versions.json`, `docs.lastVersion`, and the existing versioned
trees before selecting this workflow. The existence of `version-<major>.<minor>.0`
is normally decisive evidence that a later `<major>.<minor>.<patch>` release
must update that existing line instead.

## Scope

This scope applies only after the applicability boundary above confirms that a
new documentation line is required.

This workflow covers:

1. Write the release blog post
2. Update the English release-facing pages, including the homepage, download page, and pinned latest-version references
3. Git commit the English content checkpoint
4. Translate the zh-CN release blog and zh-CN docs
5. Git commit the translation checkpoint
6. Version the docs with `yarn docusaurus docs:version <version>`
7. Update the default docs version to the new version
8. Run a fresh subagent review before calling the work done

## Repository Facts You Must Respect

- Current docs live in `docs/`
- Versioned English docs live in `versioned_docs/version-<ver>/`
- Versioned sidebars live in `versioned_sidebars/version-<ver>-sidebars.json`
- Chinese docs live in `i18n/zh-CN/docusaurus-plugin-content-docs/current/`
- Versioned Chinese docs live in `i18n/zh-CN/docusaurus-plugin-content-docs/version-<ver>/`
- Chinese blog posts live in `i18n/zh-CN/docusaurus-plugin-content-blog/`
- Docs version history is recorded in `versions.json`
- The default released docs version is controlled by `docs.lastVersion` in `docusaurus.config.ts`
- Homepage runtime examples live in `src/components/home/HomepageLanding.tsx`
- The latest-release download page lives at `src/pages/download/index.md`
- Localized page translations live under `i18n/zh-CN/docusaurus-plugin-content-pages/`
- The wrapped versioning command is `yarn docusaurus docs:version <ver>`, which calls `scripts/docusaurus-with-i18n.sh`
- The wrapper copies every locale's `current/` docs tree to `version-<ver>/` after Docusaurus versions the English docs

## Important Caveats

- Do not run raw `docusaurus docs:version <ver>` directly. Use `yarn docusaurus docs:version <ver>` so zh-CN docs are copied too.
- Do not version docs before the English docs and zh-CN docs are in the state you want to freeze for that release.
- Run `npm run copy-i18n-fallback` before cutting the version if zh-CN `benchmarks/` or `specification/` content may still rely on fallback copies.
- `copy-i18n-fallback.sh` can create untracked fallback files under `i18n/zh-CN/.../benchmarks` and `.../specification`; do not confuse those with intentional edits.
- This repo already has some broken zh-CN doc links. A full build can fail for pre-existing reasons unrelated to your release changes. Distinguish new regressions from known baseline issues.
- Keep `tasks/*.md` and `tasks/lessons.md` out of git.
- `docs/guide` and `docs/specification` are mainly synced from `apache/fory`; avoid site-only divergence there unless that upstream sync is intentionally part of the release work.
- Abort early if target-version artifacts already exist unless the user explicitly wants to resume/repair a partial release cut. This includes:
  - `blog/*fory_<version>_release.md`
  - `static/img/blog/fory_<version>_release/`
  - `versioned_docs/version-<version>/`
  - `versioned_sidebars/version-<version>-sidebars.json`
  - `i18n/zh-CN/docusaurus-plugin-content-docs/version-<version>/`

## Step 0: Prepare Context

1. Read:
   - `package.json`
   - `docusaurus.config.ts`
   - `versions.json`
   - `scripts/docusaurus-with-i18n.sh`
   - `src/pages/download/index.md`
   - `i18n/zh-CN/docusaurus-plugin-content-pages/download/index.md` if it exists
2. Confirm the current latest released version, the target new version, and the previous released version that will become the explicit older-version route after the cut.
3. Verify the site repo already contains the intended upstream docs state from `apache/fory` before you start. Do not assume the release only touches `docs/guide`.
   - compare current `docs/` against `versioned_docs/version-<previous-version>/` to discover the actual English doc delta for this release
   - inspect the changed paths across all doc trees, including `docs/start`, `docs/guide`, `docs/compiler`, `docs/benchmarks`, `docs/specification`, `docs/introduction`, and `docs/community`
   - explicitly confirm that any upstream docs expected for the release are already synced into this repo before freezing the snapshot
   - if needed upstream docs are missing, stop and sync or ask the user before freezing a stale snapshot
4. Check that the target version is clean:
   - the release blog filename does not already exist unless this is an intentional continuation
   - the blog asset directory does not already exist unless this is an intentional continuation
   - `versioned_docs/version-<version>/` does not already exist
   - `versioned_sidebars/version-<version>-sidebars.json` does not already exist
   - `i18n/zh-CN/docusaurus-plugin-content-docs/version-<version>/` does not already exist
5. Build a concrete release-doc scope before editing:
   - scan `blog/` for the previous release post to use as template
   - scan `docs/`, `versioned_docs/`, and `i18n/zh-CN/docusaurus-plugin-content-docs/` so you understand the current tree
   - derive the release-doc scope from `versioned_docs/version-<previous-version>/` vs `docs/`
   - treat that changed-doc list as the required release-doc scope for zh-CN translation and final review, instead of guessing only a few subtrees
6. If the task is non-trivial, maintain a task note under `tasks/task-<slug>.md` and archive it to `tasks/history/` when finished.

## Step 1: Write the Release Blog

1. Ask the user to provide the English draft for the release blog if it has not already been provided.
2. Find the previous release blog in `blog/`, typically `blog/YYYY-MM-DD-fory_<prev>_release.md`.
3. Use the previous release blog as a structural/reference template, but treat the user-provided English draft as the source content for the new post.
4. Create or revise the new release post around that English draft rather than inventing the release narrative from scratch.
5. Update the post carefully:
   - frontmatter `slug`, `title`, `tags`, date-based filename
   - opening release paragraph
   - compare link
   - PR counts / contributor counts if the post includes them
   - highlights/features/fixes sections
   - benchmark images and asset paths
6. Put blog-specific assets under `static/img/blog/fory_<version>_release/` when the post needs dedicated images.
7. If you add benchmark images, ensure the referenced static paths and copied files match exactly.
8. Validate the post for obvious copy/paste errors from the previous release.

## Step 1A: Bump Versioned References in Current Docs, Homepage, and the Download Page

Before translating the zh-CN blog/docs or freezing the docs version, update all pinned current-doc references and release-facing site pages to the new release version.

Required targets:

1. `docs/start/install.md`
2. `docs/guide/**/index.md` for each language/runtime that includes versioned install or dependency examples
3. other current guide pages with pinned version examples, dependency strings, or install snippets
4. `src/components/home/HomepageLanding.tsx`
5. `src/pages/download/index.md`
6. any other current docs page that still advertises the previous release as the recommended install version

Minimum workflow:

1. Replace the previous release version with the new release version in `docs/start/install.md`
2. Scan all current docs for pinned release strings and update them where they describe the latest recommended version
3. Explicitly inspect `docs/guide/**/index.md` because these pages often carry language-specific install snippets and versioned dependency examples
4. Update `src/components/home/HomepageLanding.tsx` so homepage runtime install examples advertise the new release correctly, especially Java/Maven, Rust/Cargo, C++ `GIT_TAG`, .NET, Swift, Dart, Scala, and Kotlin/KSP snippets
5. Update `src/pages/download/index.md` so the page advertises the new release correctly:
   - update the "latest release" version and release date
   - update source, `.asc`, and `.sha512` URLs to the new artifact path
   - update the release-notes link
   - update checksum/signature example filenames and commands if they still reference the previous release
6. Update every latest-version reference before `yarn docusaurus docs:version <version>` so the frozen snapshot inherits the correct release version
7. Be especially suspicious of:
   - Maven/Gradle coordinates
   - `pip install`, `go get`, `cargo add`, `dotnet add package`
   - Bazel dependency examples
   - language-guide install snippets under `docs/guide/**`
   - language `index.md` pages under `docs/guide/**/index.md`
   - homepage runtime examples under `src/components/home/**`
   - `src/pages/download/index.md` release tables, artifact filenames, and verification examples
8. Finish all of these English/current-doc version updates before starting zh-CN translation, so the Chinese docs/blog are translated once from the final English source rather than patched twice
9. Do this before `yarn docusaurus docs:version <version>` so the released snapshot freezes the correct install guidance and the site advertises the correct latest release

## Step 2: Git Commit the English Release Checkpoint

1. Review the diff for the new blog post, `src/pages/download/index.md`, any current-doc version bumps, and any new assets.
2. Make a focused git commit for the English release-site changes.
3. Do not bundle unrelated generated files into this commit.

## Step 3: Translate zh-CN Docs

1. Use the Chinese translation workflow skill:
   - Prefer repo-local `.agents/skills/translate-docs-zh/SKILL.md` if it exists
   - Otherwise use `.claude/skills/translate-docs-zh/SKILL.md`
2. Start this step only after the English release blog and all current-doc version bumps are final.
3. If the site maintains a localized zh-CN download page, translate or sync it from the final English download page:
   - source: `src/pages/download/index.md`
   - target: `i18n/zh-CN/docusaurus-plugin-content-pages/download/index.md`
   - keep release version, release date, artifact URLs, release-notes link, and verification examples aligned with English
   - if the zh-CN download page is expected but missing, create it during the release instead of silently leaving `/zh-CN/download` stale
4. Translate or sync the zh-CN release blog:
   - source: `blog/<release-file>.md`
   - target: `i18n/zh-CN/docusaurus-plugin-content-blog/<release-file>.md`
   - preserve frontmatter structure and blog metadata unless a localized change is needed
   - keep blog asset paths aligned with the English source unless there is a deliberate zh-only asset change
5. Translate or sync the zh-CN docs for the doc changes that should ship with the new release.
   - primary path mapping: `docs/<subpath>` -> `i18n/zh-CN/docusaurus-plugin-content-docs/current/<subpath>`
   - do not limit this to `docs/guide/**`
   - translate or sync every changed English doc in the release-doc scope relative to `versioned_docs/version-<previous-version>/`
   - this includes changed files under `docs/benchmarks/**`, `docs/community/**`, `docs/compiler/**`, `docs/guide/**`, `docs/introduction/**`, `docs/specification/**`, and `docs/start/**`
   - if a changed English current doc has no matching zh-CN current update before versioning, treat that as a blocking gap unless the file is intentionally English-only and documented as such
6. Follow the translation skill's hard rule: no external translation tools or services.
7. If top-level category labels changed, also update:
   - `i18n/zh-CN/docusaurus-plugin-content-docs/current.json`
8. If the release needs localized version metadata, plan a manual follow-up for `i18n/zh-CN/docusaurus-plugin-content-docs/version-<version>.json`; the versioning wrapper does not create it.

## Step 4: Git Commit the zh-CN Checkpoint

1. Review only the intended zh-CN docs changes.
2. Include both the zh-CN release blog and zh-CN docs translation/sync in this checkpoint.
3. Commit the Chinese translation/sync separately from the release blog commit.
4. Leave task notes and lessons unstaged.

## Step 5: Freeze the New Docs Version

Before freezing:

```bash
npm run copy-i18n-fallback
```

Then, after English and zh-CN current docs are ready, run:

```bash
yarn docusaurus docs:version <version>
```

Expected effects:

- Docusaurus snapshots English docs into `versioned_docs/version-<version>/`
- Docusaurus creates `versioned_sidebars/version-<version>-sidebars.json`
- The wrapper script copies zh-CN current docs into `i18n/zh-CN/docusaurus-plugin-content-docs/version-<version>/`
- `versions.json` is updated

After the command:

1. Inspect the new `versioned_docs/version-<version>/` tree
2. Inspect `versioned_sidebars/version-<version>-sidebars.json`
3. Inspect `i18n/zh-CN/docusaurus-plugin-content-docs/version-<version>/`
4. Check for accidental carry-over of placeholder or half-English zh-CN content before accepting the snapshot
5. Decide whether a manual `i18n/zh-CN/docusaurus-plugin-content-docs/version-<version>.json` should be added for this release
6. If a later validation/build step generates additional fallback files under the new `version-<version>/` zh-CN tree, inspect them explicitly and decide whether they belong in the release commit
7. Before accepting the snapshot, explicitly compare the release-doc scope in:
   - `docs/<subpath>`
   - `i18n/zh-CN/docusaurus-plugin-content-docs/current/<subpath>`
   - `i18n/zh-CN/docusaurus-plugin-content-docs/version-<version>/<subpath>`
   and resolve any obvious case where the versioned zh snapshot froze an older current zh file

## Step 6: Update the Default Docs Version

1. Edit `docusaurus.config.ts`
2. Change:

```ts
docs: {
  lastVersion: '<version>',
}
```

3. Keep the existing repo style for `docs.versions` entries unless there is a concrete reason to change it
4. Verify `versions.json` now lists the new version first

## Step 7: Validate

Minimum validation:

1. `npx markdownlint-cli@0.25.0 '**/*.md' --ignore node_modules`
2. `npm run typecheck`
3. `npm run build`
4. Review the output and separate:
   - new failures caused by your changes
   - pre-existing failures, especially zh-CN broken links

Recommended route checks when the build is usable:

- `/`
- `/docs`
- `/zh-CN/docs`
- `/download`
- `/zh-CN/download`
- `/docs/<previous-version>/`
- `/zh-CN/docs/<previous-version>/`
- `/blog`
- `/zh-CN/blog`

Also run targeted checks:

- parameterize stale-version scans using the actual old/new versions instead of hard-coded values
- scan at least: `blog`, `docs`, `src/components/home`, `src/pages/download/index.md`, `i18n/zh-CN/docusaurus-plugin-content-pages/download/index.md`, `versioned_docs/version-<version>`, and `i18n/zh-CN/docusaurus-plugin-content-docs`
- for example, search for the previous release string, older release strings likely to be copy/paste remnants, and placeholders such as `TODO` / `TBD`
- treat stale latest-version references in current install/docs pages as blocking, especially in `docs/start/install.md`, `docs/guide/**/index.md`, and other `docs/guide/**` pages
- treat stale latest-version references in homepage runtime examples as blocking, especially in `src/components/home/HomepageLanding.tsx`
- treat stale release numbers, dates, artifact URLs, or verification examples in `src/pages/download/index.md` as blocking
- treat stale release numbers, dates, artifact URLs, or verification examples in `i18n/zh-CN/docusaurus-plugin-content-pages/download/index.md` as blocking whenever the zh download page exists or should exist
- confirm release blog asset paths exist under `static/img/blog/fory_<version>_release/`
- confirm the download page's source, signature, checksum, archive, and release-notes links match the intended new release
- confirm the zh-CN download page, if present, is semantically aligned with the English page and links to the expected zh-CN install route
- compare the release-doc scope against the previous release snapshot so you do not miss changed docs outside `guide/` such as `compiler/generated-code.md`
- for each changed English current doc in the release-doc scope, verify whether the matching zh current doc is updated, missing, or intentionally left as English fallback
- if any changed doc under `benchmarks/`, `community/`, `compiler/`, `guide/`, `introduction/`, `specification/`, or `start/` is missing from zh current, treat that as unfinished release work rather than optional follow-up

## Step 8: Fresh Self-Review

Before marking the task complete, spawn a fresh subagent and ask it to review the work with no answer leakage.

The review should check at least:

1. Are there still stale version strings or previous-release copy/paste remnants?
2. Did versioning update the expected files only?
3. Are zh-CN docs/versioned docs consistent with the intended snapshot?
4. Are the zh-CN release blog and English release blog both present and consistent with the intended release state?
5. Are blog asset paths and benchmark links valid?
6. Are there any obvious missing follow-up edits, such as `docs/start/install.md` or guide pages with pinned version references that should move to the new release?
7. Does `src/components/home/HomepageLanding.tsx` advertise the new release correctly in every pinned runtime install example?
8. Does `src/pages/download/index.md` advertise the new release correctly, including version, date, artifact URLs, release-notes link, and verification examples?
9. If `/zh-CN/download` is expected, is `i18n/zh-CN/docusaurus-plugin-content-pages/download/index.md` present and aligned with the English download page?
10. Did the workflow accidentally snapshot stale site docs because upstream `apache/fory` doc changes were not synced first?
11. Did any changed English current doc outside `guide/` fail to get translated or reviewed in zh-CN before versioning, for example under `compiler/`, `benchmarks/`, `specification/`, `start/`, or `introduction/`?
12. Does every changed zh current doc in the release-doc scope match the intended `version-<version>` snapshot, or did the workflow freeze an older zh current state?

Treat review findings as blocking until resolved or explicitly documented.

## Commit Strategy

Preferred checkpoints:

1. Blog/release-post commit
2. zh-CN release blog + docs translation commit
3. versioning/default-version commit

Keep commits focused so rollback and review stay simple.

## Output Requirements

When reporting completion, include:

1. What changed
2. Which commits or commit boundaries were created
3. Validation results
4. Any remaining known issues or pre-existing build failures
