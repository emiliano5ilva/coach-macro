let CapApp = null;

async function getCapApp() {
  if (CapApp) return CapApp;
  try {
    const mod = await import('@capacitor/app');
    CapApp = mod.App;
  } catch {}
  return CapApp;
}

const handlers = new Map();

export function onDeepLink(route, handler) {
  handlers.set(route, handler);
}

export async function initDeepLinks() {
  const cap = await getCapApp();
  if (!cap) return;

  cap.addListener('appUrlOpen', ({ url }) => {
    handleDeepLink(url);
  });

  // Handle cold-start URL (app opened via deep link while closed)
  try {
    const { url } = await cap.getLaunchUrl();
    if (url) handleDeepLink(url);
  } catch {}
}

function handleDeepLink(url) {
  if (!url?.startsWith('coachmacro://')) return;

  const path = url.replace('coachmacro://', '');
  const [route, ...parts] = path.split('/');

  const handler = handlers.get(route);
  if (handler) {
    handler(parts);
    return;
  }

  window.dispatchEvent(new CustomEvent('cm:deeplink', { detail: { route, parts } }));
}

export function openDeepLink(route, ...parts) {
  window.dispatchEvent(new CustomEvent('cm:deeplink', { detail: { route, parts } }));
  return ['coachmacro:/', route, ...parts].join('/');
}
