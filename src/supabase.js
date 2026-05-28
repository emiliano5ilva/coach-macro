import { createClient } from "@supabase/supabase-js";
export const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function signInWithGoogle() {
  return sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
}

export function signInWithApple() {
  return sb.auth.signInWithOAuth({ provider: "apple", options: { redirectTo: window.location.origin } });
}
