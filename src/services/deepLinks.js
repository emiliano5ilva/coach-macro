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

// ── On-device debug trail ─────────────────────────────────────────────────────
// WKWebView JS console isn't easily captured on a device, so we persist a redacted
// step-by-step trail to localStorage (survives a cold-start relaunch) and emit an event
// so a dev-only readout on the auth screen can show exactly where the reset flow breaks.
function redact(s) {
  return String(s || '').replace(/((?:access|refresh)_token|code)=([^&#]+)/gi, (_m, k, v) => `${k}=<${v.length}ch>`);
}
export function getFpTrail() {
  try { return JSON.parse(localStorage.getItem('cm_fp_debug') || '[]'); } catch { return []; }
}
export function clearFpTrail() {
  try { localStorage.removeItem('cm_fp_debug'); } catch {}
  try { window.dispatchEvent(new CustomEvent('cm:fp-log')); } catch {}
}
function fpLog(line) {
  try {
    const arr = getFpTrail();
    arr.push(line);
    localStorage.setItem('cm_fp_debug', JSON.stringify(arr.slice(-25)));
  } catch {}
  try { console.log('[fp]', line); } catch {}
  try { window.dispatchEvent(new CustomEvent('cm:fp-log')); } catch {}
}

export function onDeepLink(route, handler) {
  handlers.set(route, handler);
}

export async function initDeepLinks() {
  App.addListener('appUrlOpen', ({ url }) => {
    fpLog(`appUrlOpen: ${redact(url)}`);
    handleDeepLink(url);
  });

  // Cold start: app launched by tapping the deep link while fully closed.
  try {
    const result = await App.getLaunchUrl();
    fpLog(`getLaunchUrl: ${result?.url ? redact(result.url) : '(none)'}`);
    if (result?.url) handleDeepLink(result.url);
  } catch (e) {
    fpLog(`getLaunchUrl ERROR: ${e?.message || e}`);
  }
}

// Collect params from BOTH the fragment (#…) and the query (?…). Supabase's implicit flow
// returns the recovery tokens — or an error, for an expired/used link — in the URL fragment;
// the PKCE flow returns a ?code= in the query.
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

function emitResetError(params, why) {
  fpLog(`→ reset-error (${why})`);
  recoveryInProgress = false;
  window.dispatchEvent(new CustomEvent('cm:reset-password-error', {
    detail: { message: friendlyRecoveryError(params) },
  }));
}

async function handleRecovery(params) {
  const err = params.get('error') || params.get('error_code') || params.get('error_description');
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  const code = params.get('code');
  const type = params.get('type');
  fpLog(`recovery params: type=${type || '-'} access=${access_token ? access_token.length + 'ch' : 'none'} refresh=${refresh_token ? refresh_token.length + 'ch' : 'none'} code=${code ? 'yes' : 'no'} error=${err || 'none'}`);

  // Expired / already-used / invalid link → Supabase redirects with an error in the fragment.
  if (err) { emitResetError(params, 'link error'); return; }

  // Implicit flow — tokens in the hash.
  if (access_token && refresh_token) {
    recoveryInProgress = true;
    try {
      const { error } = await sb.auth.setSession({ access_token, refresh_token });
      if (error) throw error;
      fpLog('setSession OK → route reset-password');
      window.dispatchEvent(new CustomEvent('cm:deeplink', { detail: { route: 'reset-password' } }));
    } catch (e) {
      fpLog(`setSession FAIL: ${e?.message || e}`);
      emitResetError(params, 'setSession failed');
    }
    return;
  }

  // PKCE flow — exchange the ?code= for a session.
  if (code) {
    recoveryInProgress = true;
    try {
      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (error) throw error;
      fpLog('exchangeCodeForSession OK → route reset-password');
      window.dispatchEvent(new CustomEvent('cm:deeplink', { detail: { route: 'reset-password' } }));
    } catch (e) {
      fpLog(`exchangeCodeForSession FAIL: ${e?.message || e}`);
      emitResetError(params, 'code exchange failed');
    }
    return;
  }

  // No tokens, no code, no error — malformed / fragment stripped in transit.
  emitResetError(params, 'no tokens/code');
}

function handleDeepLink(url) {
  if (!url?.startsWith('coachmacro://')) { fpLog(`handleDeepLink IGNORED (not coachmacro://): ${redact(url)}`); return; }

  const rest = url.slice('coachmacro://'.length);
  const route = rest.split(/[/?#]/)[0]; // host segment only — never the token fragment
  fpLog(`handleDeepLink route=${route}`);

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
