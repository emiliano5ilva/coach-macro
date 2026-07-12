// ─── Dashboard Resolver — tier + mode derivation and section gating ───────────
import { DASHBOARD_CONFIG, SECTION_CONDITIONALS } from '../config/dashboardConfig.js';

const LEVEL_RANK = { none: 0, beginner: 0, intermediate: 1, advanced: 2 };

// ─── Mode detection ───────────────────────────────────────────────────────────
export function getUserMode(profile, wPrefs) {
  const override = profile?.dashboard_mode_override || wPrefs?.dashboardModeOverride;
  if (override && ['strength', 'hyrox', 'running', 'hybrid'].includes(override)) return override;

  if (wPrefs?.isHyrox || profile?.hyrox_race_date || wPrefs?.hyroxRaceDate) return 'hyrox';

  const isHybridFlag = profile?.is_hybrid_athlete || wPrefs?.isHybrid;
  const splitType = (wPrefs?.splitType || '').toLowerCase();
  const hasSplitWithRun = splitType.includes('run') || splitType.includes('hybrid');
  if (isHybridFlag || hasSplitWithRun) return 'hybrid';

  if (profile?.run_race_date || wPrefs?.runRaceDate) {
    // Race date should ADD running context, not erase a lifting identity.
    // A user with a split, non-beginner lift exp, or a strength goal is a hybrid athlete.
    const liftExp = (wPrefs?.liftExp || profile?.profile_data?.liftExp || profile?.liftExp || 'beginner').toLowerCase();
    const hasLiftExp    = liftExp === 'intermediate' || liftExp === 'advanced';
    const hasSplit      = !!(wPrefs?.splitType);
    const goal          = (profile?.goal || profile?.profile_data?.goal || '').toLowerCase().replace(/\s+/g, '_');
    const hasStrengthGoal = ['build_muscle', 'get_stronger', 'recomp', 'gain_strength'].includes(goal);
    return (hasLiftExp || hasSplit || hasStrengthGoal) ? 'hybrid' : 'running';
  }

  return 'strength';
}

// ─── Tier detection ───────────────────────────────────────────────────────────
export function getUserTier(profile, wPrefs, mode) {
  const override = profile?.dashboard_tier_override || wPrefs?.dashboardTierOverride;
  if (override && ['beginner', 'intermediate', 'advanced'].includes(override)) return override;

  const resolvedMode = mode || getUserMode(profile, wPrefs);

  const liftRaw   = (wPrefs?.liftExp   || profile?.profile_data?.liftExp   || profile?.liftExp   || 'beginner').toLowerCase();
  const cardioRaw = (wPrefs?.cardioExp || profile?.profile_data?.cardioExp || profile?.cardioExp || 'beginner').toLowerCase();

  const liftRank   = LEVEL_RANK[liftRaw]   ?? 0;
  const cardioRank = LEVEL_RANK[cardioRaw] ?? 0;

  let rank;
  if (resolvedMode === 'running') {
    rank = cardioRank;
  } else if (resolvedMode === 'hyrox' || resolvedMode === 'hybrid') {
    rank = Math.max(liftRank, cardioRank);
  } else {
    rank = liftRank;
  }

  return rank >= 2 ? 'advanced' : rank >= 1 ? 'intermediate' : 'beginner';
}

// ─── Section visibility ───────────────────────────────────────────────────────
// Cumulative: 'advanced' satisfies requirements for any tier in ['beginner','intermediate','advanced']
const TIER_ORDER = ['beginner', 'intermediate', 'advanced'];

function tierSatisfies(userTier, requiredTiers) {
  const userRank = TIER_ORDER.indexOf(userTier);
  return requiredTiers.some(t => TIER_ORDER.indexOf(t) <= userRank);
}

export function shouldShowSection(section, userTier, userMode, userData) {
  if (!tierSatisfies(userTier, section.tiers)) return false;
  if (!section.modes.includes(userMode)) return false;
  if (section.conditional && SECTION_CONDITIONALS[section.conditional]) {
    if (!SECTION_CONDITIONALS[section.conditional](userData)) return false;
  }
  return true;
}

// ─── Visible section IDs for a tab ───────────────────────────────────────────
export function getVisibleSections(tabId, userTier, userMode, userData) {
  const source =
    tabId === 'today'
      ? DASHBOARD_CONFIG.TODAY.sections
      : DASHBOARD_CONFIG.PROGRESS.sections[tabId] || [];

  return source
    .filter(s => shouldShowSection(s, userTier, userMode, userData))
    .sort((a, b) => (a.priority || 99) - (b.priority || 99))
    .map(s => s.id);
}

// ─── Progress tab list ────────────────────────────────────────────────────────
export function getProgressTabs(userTier, userMode) {
  const { tabs, tabVisibility } = DASHBOARD_CONFIG.PROGRESS;
  return tabs.filter(tabId => {
    const vis = tabVisibility[tabId];
    if (!vis) return false;
    if (!tierSatisfies(userTier, vis.tiers)) return false;
    if (!vis.modes.includes(userMode)) return false;
    return true;
  });
}
