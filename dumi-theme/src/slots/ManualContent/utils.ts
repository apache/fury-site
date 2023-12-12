export function getOpenKeys() {
  const pathname = window.location.pathname
    .replace('/docs/', '/')
  const pathArr = pathname.split('/');
  const openKeys = [];
  for (let i = pathArr.length; i > 0; i--) {
    const tem = pathArr.slice(0, i);
    openKeys.push(tem.join('/'));
  }
  return openKeys;
}

export function getBaseRoute() {
  let matchRoute = window.location.pathname;
  // 兼容带有docs的route
  matchRoute = matchRoute.replace('/docs', '').replace('/zh/', '/').replace('/en/', '/');
  // 查找 baseRoute
  const pathArray = matchRoute.split("/").filter(Boolean);
  if (pathArray.length === 3) {
    return [`/${pathArray[0]}/${pathArray[1]}`, pathArray[1]]
  }
  return [`/${pathArray[0]}`, "main"];
}

export function getVersions(docs) {
  let matchRoute = window.location.pathname;
  // 兼容带有docs的route
  matchRoute = matchRoute.replace('/docs', '').replace('/zh/', '/').replace('/en/', '/');
  // 查找 baseRoute
  const pathArray = matchRoute.split("/").filter(Boolean);
  const scope = pathArray[0];
  const versions = docs
    .filter(x => x.slug.startsWith(scope))
    .map(x => x.slug.replace(`${scope}/`, ''))
    .filter(Boolean);
  return ["main", ...versions];
}

export function getIndexRoute(MenuData) {
  const defaultOpenKeys = [];
  let topRoute = MenuData![0];
  defaultOpenKeys.push(topRoute.key);
  while (topRoute.children) {
    topRoute = topRoute.children[0];
    defaultOpenKeys.push(topRoute.key);
  }
  return defaultOpenKeys[defaultOpenKeys.length - 1];
}

/**
 * 返回需要跳转的 pathname
 * /en/api/ ----> /en/api/[first-doc]
 * /zh/api/ ----> /api/[first-doc]
 * /en/docs/api/ ----> /en/api/[first-doc]
 * /zh/docs/api/ ----> /api/[first-doc]
 *
 * /en/docs/api/xxx ----> /en/api/xxx
 * /zh/docs/api/xxx ----> /api/xxx
 *
 * /docs/api/xxx -----> /api/xxx
 *
 * @param p
 */
export function getNavigateUrl(
  pathname: string,
  first: string,
  siderbarMenu: any[],
) {
  // 兜底 如果 nav 指定有误则自动重定向到 indexDocRoute
  if (pathname.includes('/docs/')) {
    return pathname.replace('/docs/', '/');
  }
  if (
    siderbarMenu.every((item) => {
      const itemLowerCase = `${item}`.toLowerCase();
      return ![itemLowerCase, `${itemLowerCase}/`].includes(
        pathname.toLowerCase(),
      );
    })
  ) {
    return first;
  }
  return pathname;
}

export function safeEval(source) {
  return new Function(`return ${source}`)();
}
