// Garmin Health API — requires Garmin partner access (OAuth 1.0a)
// Docs: https://developer.garmin.com/gc-developer-program/health-api/

export const GARMIN_CONFIG = {
  requestTokenUrl: 'https://connectapi.garmin.com/oauth-service/oauth/request_token',
  authorizeUrl:    'https://connect.garmin.com/oauthConfirm',
  accessTokenUrl:  'https://connectapi.garmin.com/oauth-service/oauth/access_token',
  apiBase:         'https://apis.garmin.com/wellness-api/rest',
  consumerKey:     import.meta.env.VITE_GARMIN_CONSUMER_KEY || '',
};

// Stub — full implementation requires server-side OAuth 1.0a signing (future)
export async function syncGarminActivities(_userId) {
  return [];
}

export async function syncGarminDailies(_userId) {
  return null;
}
