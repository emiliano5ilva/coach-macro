import { App as CapApp } from '@capacitor/app';

const handlers = new Map();

export function onDeepLink(route, handler) {
  handlers.set(route, handler);
}

export function initDeepLinks() {
  CapApp.addListener('appUrlOpen', ({ url }) => {
    handleDeepLink(url);
  });

  // Handle cold-start URL (app opened via deep link while closed)
  CapApp.getLaunchUrl().then(({ url }) => {
    if (url) handleDeepLink(url);
  }).catch(() => {});
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

  // Fallback: dispatch custom event so App.jsx can handle it
  window.dispatchEvent(new CustomEvent('cm:deeplink', { detail: { route, parts } }));
}

export function openDeepLink(route, ...parts) {
  const url = ['coachmacro:/', route, ...parts].join('/');
  window.dispatchEvent(new CustomEvent('cm:deeplink', { detail: { route, parts } }));
  return url;
}
