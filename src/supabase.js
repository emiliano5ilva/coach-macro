import { createClient } from "@supabase/supabase-js";

// Retries on "Load failed / status 0" network errors that occur in iOS
// WKWebView when QUIC connections drop. CapacitorHttp (enabled in
// capacitor.config.json) already routes fetch through native NSURLSession,
// but this catches any remaining transient failures.
async function retryFetch(url, options) {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try {
      // Promise.race timeout works reliably with CapacitorHttp's native fetch
      // interception where AbortController.signal may not be honoured
      const res = await Promise.race([
        globalThis.fetch(url, options),
        new Promise((_, rej) => setTimeout(() => rej(new Error('fetch timeout')), 5000)),
      ]);
      return res;
    } catch (err) {
      lastErr = err;
      if (i < 2) await new Promise(r => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastErr;
}

export const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    global: { fetch: retryFetch },
    auth: {
      // Don't auto-refresh expired tokens on getSession() — avoids blocking
      // the WKWebView event loop on simulator cold boot with a stale JWT.
      // Tokens are refreshed lazily on the first real API call instead.
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export function signInWithGoogle() {
  return sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
}

export function signInWithApple() {
  return sb.auth.signInWithOAuth({ provider: "apple", options: { redirectTo: window.location.origin } });
}
