import { App } from '@capacitor/app';

const handlers = new Map();

export function onDeepLink(route, handler) {
  handlers.set(route, handler);
}

export async function initDeepLinks() {
  App.addListener('appUrlOpen', ({ url }) => {
    handleDeepLink(url);
  });

  // Handle cold-start URL (app opened via deep link while closed)
  try {
    const result = await App.getLaunchUrl();
    if (result?.url) handleDeepLink(result.url);
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
