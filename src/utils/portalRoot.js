// Portal mount target for full-screen overlays. The 8-theme tokens (--cm-accent, --cm-red, --cm-paper,
// --cm-ink…) are applied by applyTheme() on the .goclub element — NOT on :root (deliberately, so they
// don't bleed into non-themed screens). A createPortal to document.body therefore renders OUTSIDE that
// scope, and every var(--cm-*) falls back to its hardcoded default (the brand red) regardless of the
// chosen theme. Portaling into .goclub keeps overlays inside the token scope so themes apply.
//
// Safe for fixed-position overlays: .goclub (and its ancestors #root/body) carry no transform/
// will-change/contain, so `position:fixed` still anchors to the viewport — and because .cm-paper-card
// (the will-change:transform card) is a DESCENDANT of .goclub, portaling here still escapes that
// containing-block trap, exactly like document.body did.
export const themeRoot = () => (typeof document !== 'undefined' && document.querySelector('.goclub')) || document.body;
