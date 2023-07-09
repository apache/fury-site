import URI from 'uri-parse';
import semver from 'semver';

/*
 * parse url like this
 *
 * schema://username:password@host:port/path?key=value#fragment;key=value
 * \____/   \______/ \______/ \__/ \__/ \__/ \_______/ \______/ \______/
 *   |         |        |       |    |    |      |         |       |
 * schema      |     password   |   port  |    query    fragment   |
 *          username          host      path                     extension
 *
 * note:
 *   - username, password, port, path, query, fragment, extension is optional.
 *   - scheme, host must be setting.
 *   - username and password must be paired.
 */

export function getLangUrl(url: string, lang: string): string {
  const uri = new URI(url);
  if (uri.path.startsWith('en') || uri.path.startsWith('zh')) {
    uri.path = uri.path.slice(3);
  }

  uri.path = lang === 'en' ? `en/${uri.path}` : uri.path;

  return uri.toURI();
}

/**
 * /en/api/xxx -> api
 * /api/xxx -> api
 * /docs/api/xxx -> api 
 * api/xxx -> api
 * @param url 
 */
export function getNavCategory(url: string) {
  return (url || '').split('/').find(d => !['en', 'zh', 'docs', ''].includes(d));
}

export function findVersion(v: string, versions: string[]) {
  const version = versions.find((version) => semver.satisfies(v, version));
  return version ? version : versions[0];
}