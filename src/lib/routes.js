export function normalizePath(pathname, baseUrl = '/') {
  const basePath = baseUrl.replace(/\/+$/, '');
  const pathWithoutBase = basePath && pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;

  return pathWithoutBase.replace(/\/+$/, '') || '/';
}

export function getRoutePath({ baseUrl = '/', hash = '', pathname = '/' } = {}) {
  const hashPath = hash.startsWith('#/') ? hash.slice(1) : '';

  return hashPath || normalizePath(pathname, baseUrl);
}
