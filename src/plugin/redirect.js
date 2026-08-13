export default function (context, options) {
  const archivedDocsVersions = Array.isArray(options.archivedDocsVersions)
    ? options.archivedDocsVersions.filter(
        (version) => typeof version === 'string',
      )
    : [];

  return {
    name: "redirect-plugin",
    injectHtmlTags({ content }) {
      return {
        headTags: [
          {
            tagName: "script",
            attributes: {
              type: "text/javascript",
            },
            innerHTML: `
              if (window.location.host === 'fury.apache.org') {
                window.location.href = 'https://fory.apache.org';
              }

              // Archived docs own their HTML and hashed assets under
              // /archive/. This runs on the generated 404 page so existing
              // pre-1.0 deep links keep working after those versions are no
              // longer part of the current Docusaurus build.
              (function() {
                var archivedVersions = ${JSON.stringify(archivedDocsVersions)};
                if (archivedVersions.length === 0) {
                  return;
                }

                var segments = window.location.pathname.split('/').filter(Boolean);
                var locale = /^[a-z]{2}-[A-Z]{2}$/.test(segments[0])
                  ? segments[0]
                  : null;
                var docsIndex = locale ? 1 : 0;
                if (
                  segments[docsIndex] !== 'docs' ||
                  archivedVersions.indexOf(segments[docsIndex + 1]) < 0
                ) {
                  return;
                }

                var destination = ['/archive'];
                if (locale) {
                  destination.push(locale);
                }
                destination.push.apply(destination, segments.slice(docsIndex));
                var suffix = window.location.pathname.endsWith('/') ? '/' : '';
                window.location.replace(
                  destination.join('/') + suffix + window.location.search + window.location.hash
                );
              })();

              // Redirect current/latest and dev entry pages that moved in the
              // capability-first documentation restructure. Explicit released
              // versions keep their original routes.
              (function() {
                var segments = window.location.pathname.split('/').filter(Boolean);
                var docsIndex = segments[0] === 'docs'
                  ? 0
                  : /^[a-z]{2}-[A-Z]{2}$/.test(segments[0]) && segments[1] === 'docs'
                    ? 1
                    : -1;
                if (docsIndex < 0) {
                  return;
                }

                var pathIndex = docsIndex + 1;
                var version = segments[pathIndex];
                if (/^[0-9]+[.][0-9]+(?:[.][0-9]+)?$/.test(version)) {
                  return;
                }
                if (version === 'next') {
                  pathIndex++;
                }

                var oldPath = segments.slice(pathIndex).join('/');
                var routes = {
                  'introduction/overview': 'introduction',
                  'introduction/benchmark': 'benchmarks',
                  'start/install': 'start',
                  'start/usage': 'start',
                  'guide/xlang': 'object-serialization/xlang',
                  'guide/xlang/getting_started': 'object-serialization/xlang',
                  'guide/xlang/serialization': 'object-serialization/xlang',
                  'guide/java/json_support': 'json',
                  'guide/rust': 'object-serialization/rust',
                  'guide/rust/external_types': 'object-serialization/rust/external-types',
                  'guide/dart/external_types': 'object-serialization/dart/external-types',
                  'guide/swift/external_types': 'object-serialization/swift/external-types',
                  'guide/csharp/external_types': 'object-serialization/csharp/external-types',
                  'guide/csharp/basic_serialization': 'object-serialization/csharp/basic-serialization',
                  'guide/dart/inheritance': 'object-serialization/dart/inheritance',
                  'benchmarks/rust': 'benchmarks/object-serialization/xlang/rust',
                  'compiler/compiler_guide': 'compiler/getting-started',
                  'community/development': 'development',
                };
                var destination = routes[oldPath];
                if (!destination) {
                  return;
                }

                var prefix = '/' + segments.slice(0, pathIndex).join('/');
                window.location.replace(
                  prefix + '/' + destination + '/' + window.location.search + window.location.hash
                );
              })();

              // Backwards compatibility: Redirect old double "docs" URLs to cleaner URLs
              // Redirect /docs/{version}/docs/guide/* to /docs/{version}/guide/*
              // Also handles locale prefixes like /zh-CN/docs/...
              (function() {
                var path = window.location.pathname;
                var segments = path.split('/').filter(Boolean);
                var docsIndex = segments[0] === 'docs'
                  ? 0
                  : /^[a-z]{2}-[A-Z]{2}$/.test(segments[0]) && segments[1] === 'docs'
                    ? 1
                    : -1;
                if (docsIndex < 0) {
                  return;
                }

                var sections = ['guide', 'introduction', 'start'];
                var duplicateIndex = docsIndex + 1;
                var version = segments[duplicateIndex];
                if (version === 'next' || /^[0-9]+[.][0-9]+(?:[.][0-9]+)?$/.test(version)) {
                  duplicateIndex++;
                }
                if (
                  segments[duplicateIndex] !== 'docs' ||
                  sections.indexOf(segments[duplicateIndex + 1]) < 0
                ) {
                  return;
                }

                segments.splice(duplicateIndex, 1);
                var newPath = '/' + segments.join('/');
                if (path.endsWith('/')) {
                  newPath += '/';
                }
                window.location.replace(newPath + window.location.search + window.location.hash);
              })();
            `,
          },
        ],
      };
    },
  };
}
