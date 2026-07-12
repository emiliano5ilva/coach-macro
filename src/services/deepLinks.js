import { App } from '@capacitor/app';
import { sb } from '../supabase.js';

const handlers = new Map();

// True while a Supabase password-recovery session is being established / used. setSession()
// on a recovery token emits SIGNED_IN, which onAuthStateChange would otherwise route straight
// into the app — bypassing the "set a new password" screen. NativeApp checks this flag to
// route to the reset screen instead, and clears it once the new password is saved.
let recoveryInProgress = false;
export function isRecoveryInProgress() { return recoveryInProgress; }
export function clearRecovery() { recoveryInProgress = false; }

export function onDeepLink(route, handler) {
  handlers.set(route, handler);
}

export async function initDeepLinks() {
  App.addListener('appUrlOpen', ({ url }) => { handleDeepLink(url); });

  // Cold start: app launched by tapping the deep link while fully closed.
  try {
    const result = await App.getLaunchUrl();
    if (result?.url) handleDeepLink(result.url);
  } catch {}
}

// Collect params from BOTH the fragment (#…) and the query (?…). Supabase's implicit flow
// returns the recovery tokens — or an error, for an expired/used link — in the URL fragment.
function collectParams(rest) {
  const params = new URLSearchParams();
  const frag = rest.includes('#') ? rest.slice(rest.indexOf('#') + 1) : '';
  const query = rest.includes('?') ? rest.slice(rest.indexOf('?') + 1).split('#')[0] : '';
  for (const seg of [frag, query]) {
    if (!seg) continue;
    new URLSearchParams(seg).forEach((v, k) => { if (!params.has(k)) params.set(k, v); });
  }
  return params;
}

function friendlyRecoveryError(params) {
  const code = `${params.get('error_code') || ''} ${params.get('error') || ''}`;
  if (/expired|otp_expired|access_denied/i.test(code)) {
    return 'This password reset link has expired or has already been used. Please request a new one.';
  }
  return 'This password reset link is invalid. Please request a new one.';
}

function emitResetError(params) {
  recoveryInProgress = false;
  window.dispatchEvent(new CustomEvent('cm:reset-password-error', {
    detail: { message: friendlyRecoveryError(params) },
  }));
}

async function handleRecovery(params) {
  // Expired / already-used / invalid link → Supabase redirects with an error in the fragment.
  if (params.get('error') || params.get('error_code') || params.get('error_description')) {
    emitResetError(params);
    return;
  }

  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  if (params.get('type') === 'recovery' && access_token && refresh_token) {
    recoveryInProgress = true;
    try {
      const { error } = await sb.auth.setSession({ access_token, refresh_token });
      if (error) throw error;
      // Recovery session established — show the "set new password" screen.
      window.dispatchEvent(new CustomEvent('cm:deeplink', { detail: { route: 'reset-password' } }));
    } catch {
      emitResetError(params);
    }
    return;
  }

  // No tokens and no error — malformed link; a clear message beats a dead reset screen.
  emitResetError(params);
}

function handleDeepLink(url) {
  if (!url?.startsWith('coachmacro://')) return;

  const rest = url.slice('coachmacro://'.length);
  const route = rest.split(/[/?#]/)[0]; // host segment only — never the token fragment

  if (route === 'reset-password') { handleRecovery(collectParams(rest)); return; }

  const parts = rest.split('#')[0].split('?')[0].split('/').slice(1);
  const handler = handlers.get(route);
  if (handler) { handler(parts); return; }

  window.dispatchEvent(new CustomEvent('cm:deeplink', { detail: { route, parts } }));
}

export function openDeepLink(route, ...parts) {
  window.dispatchEvent(new CustomEvent('cm:deeplink', { detail: { route, parts } }));
  return ['coachmacro:/', route, ...parts].join('/');
}
