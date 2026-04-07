const { contextBridge } = require('electron');

const LOCAL_PORT_ARG = process.argv.find((a) => a.startsWith('--trustinn-local-api-port='));
const REMOTE_ORIGIN_ARG = process.argv.find((a) => a.startsWith('--trustinn-remote-origin='));

const LOCAL_PORT = LOCAL_PORT_ARG ? LOCAL_PORT_ARG.split('=')[1] : '4310';
const REMOTE_ORIGIN = REMOTE_ORIGIN_ARG ? REMOTE_ORIGIN_ARG.split('=')[1] : 'https://trustinn.nitminer.com';
const LOCAL_BASE = `http://127.0.0.1:${LOCAL_PORT}`;

const LOCAL_TOOL_PATHS = new Set([
  '/api/tools/execute',
  '/api/tools/compile',
  '/api/tools/compile-stream',
  '/api/samples'  // Offline sample loading
]);

function parseUrl(input) {
  try {
    if (typeof input === 'string') return new URL(input, window.location.origin);
    if (input instanceof URL) return input;
    if (input && typeof input.url === 'string') return new URL(input.url, window.location.origin);
  } catch (_) {
    return null;
  }
  return null;
}

function shouldRewrite(urlObj) {
  if (!urlObj) return false;
  const sameOrigin = urlObj.origin === window.location.origin || urlObj.origin === REMOTE_ORIGIN;
  return sameOrigin && LOCAL_TOOL_PATHS.has(urlObj.pathname);
}

const nativeFetch = window.fetch.bind(window);

window.fetch = async (input, init) => {
  const parsed = parseUrl(input);
  if (!shouldRewrite(parsed)) {
    return nativeFetch(input, init);
  }

  const rewritten = `${LOCAL_BASE}${parsed.pathname}${parsed.search}`;

  if (input instanceof Request) {
    const requestInit = {
      method: input.method,
      headers: input.headers,
      body: ['GET', 'HEAD'].includes(input.method) ? undefined : await input.clone().arrayBuffer(),
      mode: 'cors',
      credentials: 'include',
      cache: input.cache,
      redirect: input.redirect,
      referrer: input.referrer,
      referrerPolicy: input.referrerPolicy,
      integrity: input.integrity,
      keepalive: input.keepalive,
      signal: input.signal,
    };
    return nativeFetch(rewritten, requestInit);
  }

  return nativeFetch(rewritten, {
    ...init,
    mode: 'cors',
    credentials: 'include',
  });
};

contextBridge.exposeInMainWorld('trustinnDesktop', {
  localApiBase: LOCAL_BASE,
  remoteOrigin: REMOTE_ORIGIN,
  reroutedPaths: Array.from(LOCAL_TOOL_PATHS),
});
