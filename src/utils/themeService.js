// ─── Theme Service ────────────────────────────────────────────────────────────
// Manages the user's chosen accent + background color pair.
// Applies CSS custom properties to :root so the entire app reacts instantly.

export const ACCENT_COLORS = [
  { id: 'red',        name: 'Red',         hex: '#FF3B30', rgb: '255,59,48'  },
  { id: 'royalblue',  name: 'Royal Blue',  hex: '#0001FC', rgb: '0,1,252'    },
  { id: 'pink',       name: 'Pink',        hex: '#FD14F1', rgb: '253,20,241' },
  { id: 'orange',     name: 'Orange',      hex: '#FF5C00', rgb: '255,92,0'   },
  { id: 'rose',       name: 'Rose',        hex: '#FD1E8D', rgb: '253,30,141' },
  { id: 'green',      name: 'Green',       hex: '#2CFE05', rgb: '44,254,5'   },
  { id: 'purple',     name: 'Purple',      hex: '#9D00FF', rgb: '157,0,255'  },
  { id: 'neonpurple', name: 'Neon Purple', hex: '#BF00FD', rgb: '191,0,253'  },
];

export const BG_COLORS = [
  { id: 'white',    name: 'White',         hex: '#FFFFFF', rgb: '255,255,255' },
  { id: 'black',    name: 'Black',         hex: '#000000', rgb: '0,0,0'       },
  // Reserved — re-add when dynamic palette ships:
  // { id: 'charcoal', name: 'Charcoal',      hex: '#1C1C1E', rgb: '28,28,30'    },
  // { id: 'navy',     name: 'Dark Navy',     hex: '#0A1628', rgb: '10,22,40'    },
  // { id: 'forest',   name: 'Deep Forest',   hex: '#0A1F0A', rgb: '10,31,10'    },
  // { id: 'dpurple',  name: 'Deep Purple',   hex: '#1A0A2E', rgb: '26,10,46'    },
  // { id: 'burgundy', name: 'Dark Burgundy', hex: '#1F0A0A', rgb: '31,10,10'    },
];

export const DEFAULT_THEME = { accent: 'red', bg: 'white' };

// ── WCAG helpers ──────────────────────────────────────────────────────────────

function hex6(hex) {
  const h = hex.replace('#', '');
  return h.length === 3 ? h.split('').map(c => c + c).join('') : h;
}

function getLuminance(hex) {
  const h = hex6(hex);
  const [r, g, b] = [0, 2, 4].map(i => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1), l2 = getLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function isLightBg(bgHex) {
  return getLuminance(bgHex) > 0.18;
}

// Minimum contrast ratio for a usable UI accent (lower than WCAG text — used for buttons/icons)
const MIN_CONTRAST = 2.5;

export function isCompatible(accentHex, bgHex) {
  if (accentHex.toUpperCase() === bgHex.toUpperCase()) return false;
  return contrastRatio(accentHex, bgHex) >= MIN_CONTRAST;
}

// ── Card background: slightly lifted from base bg ────────────────────────────

function liftColor(rgb, amount) {
  const [r, g, b] = rgb.split(',').map(Number);
  const lift = (c) => Math.min(255, Math.round(c + (255 - c) * amount));
  return `#${[r, g, b].map(lift).map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

// ── Apply theme to :root CSS variables ───────────────────────────────────────

export function applyTheme(accentId, bgId) {
  const accent = ACCENT_COLORS.find(c => c.id === accentId) || ACCENT_COLORS[0];
  const bg     = BG_COLORS.find(c => c.id === bgId)         || BG_COLORS[0];
  const light  = isLightBg(bg.hex);

  // Text / border tokens auto-adapt to bg brightness
  const text       = light ? '#1a1a1a'              : '#f5f5f0';
  const textRgb    = light ? '26,26,26'             : '245,245,240';
  const textDim    = light ? 'rgba(0,0,0,0.60)'     : 'rgba(245,245,240,0.65)';
  const textFaint  = light ? 'rgba(0,0,0,0.40)'     : 'rgba(245,245,240,0.40)';
  const textGhost  = light ? 'rgba(0,0,0,0.20)'     : 'rgba(245,245,240,0.20)';
  const borderSub  = light ? 'rgba(0,0,0,0.08)'     : 'rgba(245,245,240,0.06)';
  const borderMed  = light ? 'rgba(0,0,0,0.15)'     : 'rgba(245,245,240,0.12)';
  const borderStr  = light ? 'rgba(0,0,0,0.25)'     : 'rgba(245,245,240,0.20)';
  const cardBg     = light ? '#ececec'               : liftColor(bg.rgb, 0.06);
  const cardBorder = light ? 'rgba(0,0,0,0.10)'     : 'rgba(245,245,240,0.07)';

  const goclub = document.querySelector('.goclub');
  if (!goclub) {
    // .goclub isn't mounted yet (pre-auth: splash/login/onboarding).
    // Do NOT write to :root — it would bleed into non-themed screens.
    // The App-mount effect re-calls applyTheme once .goclub exists.
    // Still update the status-bar meta tag, then bail.
    const metaEl = document.querySelector('meta[name="theme-color"]');
    if (metaEl) metaEl.setAttribute('content', bg.hex);
    return;
  }
  const set = (k, v) => goclub.style.setProperty(k, v);

  // Theme tokens
  set('--accent',        accent.hex);
  set('--accent-rgb',    accent.rgb);
  set('--bg',            bg.hex);
  set('--bg-rgb',        bg.rgb);
  set('--text',          text);
  set('--text-rgb',      textRgb);
  set('--text-dim',      textDim);
  set('--text-faint',    textFaint);
  set('--text-ghost',    textGhost);
  set('--card-bg',       cardBg);
  set('--card-border',   cardBorder);
  set('--border-subtle', borderSub);
  set('--border-medium', borderMed);
  set('--border-strong', borderStr);

  // Legacy aliases so existing var(--red), var(--navy), var(--white) etc. all follow theme
  set('--red',           accent.hex);
  set('--red-dim',       accent.hex);
  set('--navy',          bg.hex);
  set('--navy-mid',      cardBg);
  set('--navy-light',    cardBg);
  set('--navy-card',     cardBg);
  set('--surface-1',     cardBg);
  set('--surface-2',     cardBg);
  set('--surface-3',     cardBg);
  set('--white',         text);
  set('--white-dim',     textDim);
  set('--white-faint',   textFaint);
  set('--white-border',  `rgba(${accent.rgb},0.08)`);

  // Tab bar background — translucent blur bar, adapts to theme
  const tabBarBg = light ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)';
  set('--tab-bar-bg', tabBarBg);

  // Body background — set directly so html/body/#root safe-area zones follow the theme.
  // applyTheme() sets vars on .goclub (not :root), so ancestors need an explicit set.
  document.body.style.background = bg.hex;

  // ── Bridge to --cm-* namespace (the redesigned red/white system) ──
  // Paper is white on white-bg, near-black (#0A0A0A) on dark-bg — pure black (#000000) is too harsh on red canvas.
  const isLight = bg.id === 'white';
  const cmPaperHex = isLight ? '#FFFFFF' : '#0A0A0A';
  const cmPaperRgb = isLight ? '255,255,255' : '10,10,10';
  const cmInkHex   = isLight ? '#0A0A0A' : '#FFFFFF';
  const cmInkRgb   = isLight ? '10,10,10' : '255,255,255';
  set('--cm-red',        accent.hex);
  set('--cm-red-rgb',    accent.rgb);
  set('--cm-accent',     accent.hex);
  set('--cm-accent-rgb', accent.rgb);
  set('--cm-paper',      cmPaperHex);
  set('--cm-paper-rgb',  cmPaperRgb);
  set('--cm-ink',        cmInkHex);
  set('--cm-ink-rgb',    cmInkRgb);

  // Status bar tint only — body background intentionally NOT set here;
  // login/onboarding set their own hardcoded backgrounds, and .goclub sets the tab canvas.
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', bg.hex);
}

export function applyDefaultTheme() {
  applyTheme(DEFAULT_THEME.accent, DEFAULT_THEME.bg);
}

// Called from NativeApp loadProfile — wprefs.theme = { accent, bg }
export function loadAndApplyTheme(wprefs) {
  const saved = wprefs?.theme;
  if (saved?.accent && saved?.bg) {
    applyTheme(saved.accent, saved.bg);
    return { accent: saved.accent, bg: saved.bg };
  }
  applyDefaultTheme();
  return { ...DEFAULT_THEME };
}
