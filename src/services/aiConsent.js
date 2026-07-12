// AI consent bridge — strict "off until consented" (Apple Nov 2025 rule).
// No user data reaches Anthropic/Claude until the user explicitly enables AI
// features. The React app (a) mirrors profiles.ai_features_enabled via setAIEnabled,
// and (b) registers a requester that shows the one-time consent sheet. Every AI
// network call funnels through ensureAIConsent() first.

let _enabled = false;      // mirrors profiles.ai_features_enabled
let _requester = null;     // React-registered: () => Promise<boolean> (shows the sheet)

export function setAIEnabled(v) { _enabled = !!v; }
export function isAIEnabled() { return _enabled; }
export function registerAIConsentRequester(fn) { _requester = fn; }

// Call before ANY Anthropic request. Resolves true if allowed to proceed.
// Already consented → true. Otherwise show the sheet: Enable → true (persist upstream),
// Not now → false. No requester wired → deny (strict default).
export async function ensureAIConsent() {
  if (_enabled) return true;
  if (!_requester) return false;
  try {
    const ok = await _requester();
    if (ok) _enabled = true;
    return !!ok;
  } catch {
    return false;
  }
}

export class AIConsentDeclined extends Error {
  constructor() {
    super('AI features are off');
    this.name = 'AIConsentDeclined';
    this.aiConsentDeclined = true;
  }
}
