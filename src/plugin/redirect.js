export default function (context, options) {
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

              // Redirect a small set of current/dev entry pages that moved in the
              // capability-first documentation restructure. Released versions keep
              // their original routes, and old fragments are intentionally dropped.
              (function() {
                var segments = window.location.pathname.split('/').filter(Boolean);
                var docsIndex = segments[0] === 'docs'
                  ? 0
                  : /^[a-z]{2}-[A-Z]{2}$/.test(segments[0]) && segments[1] === 'docs'
                    ? 1
                    : -1;
                if (docsIndex < 0 || segments[docsIndex + 1] !== 'next') {
                  return;
                }

                var oldPath = segments.slice(docsIndex + 2).join('/');
                var routes = {
                  'introduction/overview': 'introduction',
                  'introduction/benchmark': 'benchmarks',
                  'start/install': 'start',
                  'start/usage': 'start',
                  'guide/xlang/index': 'object-serialization/xlang',
                  'guide/xlang/getting-started': 'object-serialization/xlang',
                  'guide/xlang/serialization': 'object-serialization/xlang',
                  'guide/java/json-support': 'json',
                  'compiler/compiler-guide': 'compiler/getting-started',
                  'community/DEVELOPMENT': 'development/building',
                };
                var destination = routes[oldPath];
                if (!destination) {
                  return;
                }

                var prefix = '/' + segments.slice(0, docsIndex + 2).join('/');
                window.location.replace(
                  prefix + '/' + destination + '/' + window.location.search
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
