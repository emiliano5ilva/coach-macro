// WHOOP OAuth 2.0 — authorization_code flow
// Docs: https://developer.whoop.com/api

export const WHOOP_CONFIG = {
  authUrl:    'https://api.prod.whoop.com/oauth/oauth2/auth',
  tokenUrl:   'https://api.prod.whoop.com/oauth/oauth2/token',
  apiBase:    'https://api.prod.whoop.com/developer/v1',
  scope:      'offline read:recovery read:cycles read:workout read:sleep read:profile',
  clientId:   import.meta.env.VITE_WHOOP_CLIENT_ID || '',
};

export function getWhoopAuthUrl(userId) {
  const url = new URL(WHOOP_CONFIG.authUrl);
  url.searchParams.set('client_id', WHOOP_CONFIG.clientId);
  url.searchParams.set('redirect_uri', `${import.meta.env.VITE_API_BASE_URL}/api/whoop/callback`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', WHOOP_CONFIG.scope);
  url.searchParams.set('state', userId);
  return url.toString();
}

// Stub — implemented server-side in api/whoop/callback.js (future)
export async function syncWhoopRecovery(_userId) {
  return null;
}

export async function syncWhoopWorkouts(_userId) {
  return [];
}
