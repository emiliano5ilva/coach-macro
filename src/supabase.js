import { createClient } from "@supabase/supabase-js";
export const sb = createClient(
  "https://oxxihlwqukbakmnnavuy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eGlobHdxdWtiYWttbm5hdnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MTc3OTUsImV4cCI6MjA5MjQ5Mzc5NX0.IIK9gfRtgVidt6dShxAn6OCVNxIvdbFSFDYzWgVNFbk"
);

export function signInWithGoogle() {
  return sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
}

export function signInWithApple() {
  return sb.auth.signInWithOAuth({ provider: "apple", options: { redirectTo: window.location.origin } });
}
