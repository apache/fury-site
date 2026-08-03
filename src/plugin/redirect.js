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
            // Regex literals need doubled backslashes here so the emitted script
            // retains the slash escapes required by JavaScript regex syntax.
            innerHTML: `
              if (window.location.host === 'fury.apache.org') {
                window.location.href = 'https://fory.apache.org';
              }

              // Redirect only dev-doc routes that moved during the capability-first
              // documentation migration. The unversioned route is the released 1.5.0
              // documentation, so it must retain its original paths.
              (function() {
                var path = window.location.pathname;
                var match = path.match(/^((?:\\/[a-z]{2}-[A-Z]{2})?\\/docs\\/next)\\/?(.*)$/);
                if (!match) {
                  return;
                }

                var prefix = match[1];
                var rest = match[2].replace(/\\/+$/, '');
                var targetHash = window.location.hash;

                var directRoutes = {
                  'introduction/overview': 'introduction',
                  'introduction/benchmark': 'benchmarks',
                  'start/install': 'start',
                  'start/usage': 'start',
                  'community/development': 'development/building',
                  'community/DEVELOPMENT': 'development/building',
                  'cpp_debug': 'development/cpp-debugging',
                  'security/index': 'object-serialization/security',
                  'security/threat-model': 'object-serialization/security',
                  'security/deserialization': 'object-serialization/deserialization-security-model',
                };
                var destination = directRoutes[rest];

                if (!destination && /^compiler\\/compiler[-_]guide$/.test(rest)) {
                  destination = 'compiler/getting-started';
                  var compilerGuideHash = targetHash.slice(1);
                  if (/^(command-line-interface|basic-usage|options|scan-generated-files|examples|import-path-resolution|supported-languages|output-structure|error-handling|best-practices|troubleshooting|syntax-errors|duplicate-|unknown-type-references|command-not-found|permission-denied|import-errors-in-generated-code)/.test(compilerGuideHash)) {
                    destination = 'compiler/cli';
                  } else if (/^(build-integration|maven-java|gradle-javakotlin|python-setuptools|go-go-generate|rust-buildrs|cmake-c|bazel|dart--flutter)/.test(compilerGuideHash)) {
                    destination = 'compiler/build-integration';
                  }
                }

                if (!destination && /^compiler\\/generated[-_]code$/.test(rest)) {
                  destination = 'compiler/generated-code';
                  var generatedRuntime = {
                    'java': 'java',
                    'python': 'python',
                    'rust': 'rust',
                    'c': 'cpp',
                    'c-1': 'csharp',
                    'go': 'go',
                    'javascripttypescript': 'javascript',
                    'swift': 'swift',
                    'dart': 'dart',
                    'kotlin': 'kotlin',
                    'scala': 'scala',
                  }[targetHash.slice(1)];
                  if (generatedRuntime) {
                    destination += '/' + generatedRuntime;
                    targetHash = '';
                  }
                }

                if (!destination && rest.indexOf('benchmarks/') === 0) {
                  var benchmarkParts = rest.split('/');
                  var benchmarkRuntime = benchmarkParts[1];
                  if (benchmarkRuntime === 'java' && benchmarkParts[2] === 'json') {
                    destination = 'benchmarks/json/java';
                  } else if (benchmarkRuntime === 'java') {
                    destination = 'benchmarks/object-serialization/native/java';
                  } else if (benchmarkRuntime) {
                    destination = 'benchmarks/object-serialization/xlang/' + benchmarkRuntime;
                  }
                }

                if (!destination && rest.indexOf('guide/') === 0) {
                  var parts = rest.split('/');
                  var runtime = parts[1];
                  var topic = parts.slice(2).join('/').replace(/_/g, '-');
                  if (runtime === 'xlang') {
                    var xlangTopics = {
                      '': '',
                      'index': '',
                      'serialization-index': '',
                      'getting-started': '',
                      'serialization': '',
                      'field-nullability': 'nullability',
                      'field-reference-tracking': 'references',
                      'reference-tracking': 'references',
                      'field-type-meta': 'type-identity',
                      'row-format': '__row__',
                    };
                    var xlangTopic = xlangTopics[topic] ?? topic;
                    destination = xlangTopic === '__row__'
                      ? 'row-format/standard'
                      : 'object-serialization/xlang/' + xlangTopic;
                  } else if (topic === 'grpc-support') {
                    destination = 'grpc/' + runtime;
                  } else if (topic === 'row-format') {
                    destination = 'row-format/' + runtime;
                  } else if (topic === 'json-support') {
                    destination = 'json';
                  } else if (topic === 'android-support') {
                    destination = 'object-serialization/java/android';
                  } else if (topic === 'graalvm-support') {
                    destination = 'object-serialization/java/graalvm';
                  } else {
                    var renamedTopics = {
                      'serialization-index': '',
                      'basic-serialization': 'core-api',
                      'native-serialization': 'native',
                      'type-serialization': 'native',
                      'xlang-serialization': 'xlang',
                      'schema-idl': 'xlang',
                    };
                    var migratedTopic = renamedTopics[topic] ?? topic;
                    destination = 'object-serialization/' + runtime;
                    if (migratedTopic && migratedTopic !== 'index') {
                      destination += '/' + migratedTopic;
                    }
                  }
                }

                if (destination === 'json') {
                  var jsonHash = targetHash.slice(1);
                  var jsonHashRoutes = {
                    'requirements-and-installation': ['json/getting-started', 'requirements-and-installation'],
                    'jdk-25-and-later': ['json/getting-started', 'jdk-25-and-later'],
                    'quick-start': ['json/getting-started', 'quick-start'],
                    'reading-and-writing': ['json/getting-started', 'reading-and-writing-apis'],
                    'generic-and-declared-types': ['json/getting-started', 'generic-types'],
                    'thread-safety-and-code-generation': ['json/object-mapping', 'thread-safety-reuse-and-code-generation'],
                    'object-mapping': ['json/object-mapping', 'java-object-mapping'],
                    'supported-java-types': ['json/object-mapping', 'supported-java-types'],
                    'builder-configuration': ['json/object-mapping', 'builder-configuration'],
                    'annotations': ['json/annotations', ''],
                    'naming-strategy': ['json/annotations', 'property-naming-strategy'],
                    'custom-codecs': ['json/custom-codecs', ''],
                    'type-validation-and-untrusted-input': ['json/security', 'type-policy-and-class-loading'],
                    'limits-and-unsupported-features': ['json', 'limits-and-unsupported-features'],
                    'errors-and-troubleshooting': ['json/troubleshooting', ''],
                    'related-java-guides': ['json', ''],
                  };
                  var jsonRoute = jsonHashRoutes[jsonHash];
                  if (jsonRoute) {
                    destination = jsonRoute[0];
                    targetHash = jsonRoute[1] ? '#' + jsonRoute[1] : '';
                  } else if (/^(mixins|json|dynamic-object-members)/.test(jsonHash)) {
                    destination = 'json/annotations';
                  } else if (/^(selecting-codecs|codec-)/.test(jsonHash)) {
                    destination = 'json/custom-codecs';
                  }
                }

                if (destination) {
                  window.location.replace(
                    prefix + '/' + destination.replace(/^\\/+|\\/+$/g, '') +
                    '/' + window.location.search + targetHash
                  );
                }
              })();

              // Backwards compatibility: Redirect old double "docs" URLs to cleaner URLs
              // Redirect /docs/{version}/docs/guide/* to /docs/{version}/guide/*
              // Also handles locale prefixes like /zh-CN/docs/...
              (function() {
                var path = window.location.pathname;
                var sections = ['guide', 'introduction', 'start'];
                // Match patterns like:
                // /docs/docs/guide/... or /docs/next/docs/guide/... or /docs/0.14/docs/guide/...
                // Also with locale: /zh-CN/docs/docs/guide/... or /zh-CN/docs/next/docs/guide/...
                var localePrefix = '(?:\\\\/[a-z]{2}-[A-Z]{2})?';
                var versionPrefix = '(?:\\\\/(?:next|[0-9]+\\\\.[0-9]+(?:\\\\.[0-9]+)?))?';

                for (var i = 0; i < sections.length; i++) {
                  var section = sections[i];
                  // Pattern: /docs/{optionalVersion}/docs/{section}/...
                  // Redirect to: /docs/{optionalVersion}/{section}/...
                  var pattern = new RegExp(
                    '^(' + localePrefix + '\\\\/docs' + versionPrefix + ')\\\\/docs\\\\/' + section + '(\\\\/.*)?$'
                  );
                  var match = path.match(pattern);
                  if (match) {
                    var prefix = match[1];
                    var suffix = match[2] || '';
                    var newPath = prefix + '/' + section + suffix;
                    window.location.replace(newPath + window.location.search + window.location.hash);
                    return;
                  }
                }
              })();
            `,
          },
        ],
      };
    },
  };
}
