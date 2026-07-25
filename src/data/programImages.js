const BASE = '/images/programs';

export const PROGRAM_IMAGES = {
  // ── Hypertrophy ──────────────────────────────────────────
  'ppl_6':                    `${BASE}/ppl_6.png`,
  'upper_lower':              `${BASE}/upper_lower.png`,
  'bro_split':                `${BASE}/bro_split.png`,
  'full_body':                `${BASE}/full_body.png`,

  // ── Strength ─────────────────────────────────────────────
  'powerbuilding':            `${BASE}/powerbuilding.png`,
  '5_3_1':                    `${BASE}/5_3_1.png`,
  'sl5x5':                    `${BASE}/sl5x5.png`,
  'upper_lower_new':          `${BASE}/upper_lower_new.png`,
  'phul':                     `${BASE}/phul.png`,
  'dumbbell_ppl':             `${BASE}/dumbbell_ppl.png`,
  'dumbbell_upper_lower':     `${BASE}/dumbbell_upper_lower.png`,
  'bodyweight_foundation':    `${BASE}/bodyweight_foundation.png`,
  'calisthenics_progression': `${BASE}/calisthenics_progression.png`,

  // ── Sculpt ───────────────────────────────────────────────
  'full_body_sculpt':         `${BASE}/full_body_sculpt.png`,
  'pilates_strength':         `${BASE}/pilates_strength.png`,
  'hourglass':                `${BASE}/hourglass.png`,
  'band_sculpt':              `${BASE}/band_sculpt.png`,
  'advanced_sculpt':          `${BASE}/advanced_sculpt.png`,

  // ── Golden Era ───────────────────────────────────────────
  'arnold':                   `${BASE}/arnold.png`,
  'platz_volume':             `${BASE}/platz_volume.png`,
  'mentzer_hit':              `${BASE}/mentzer_hit.png`,
  'gvt':                      `${BASE}/gvt.png`,
  'reg_park':                 `${BASE}/reg_park.png`,
  'nubret_pump':              `${BASE}/nubret_pump.png`,
  'weider_superset':          `${BASE}/weider_superset.png`,
  'pre_exhaust':              `${BASE}/pre_exhaust.png`,

  // ── Fat Loss & Conditioning ──────────────────────────────
  'circuit':                  `${BASE}/circuit.png`,
  'hiit':                     `${BASE}/hiit.png`,
  'metabolic':                `${BASE}/metabolic.png`,
  'hiit_strength':            `${BASE}/hiit_strength.png`,

  // ── Running ──────────────────────────────────────────────
  'c25k':                     `${BASE}/c25k.png`,
  '5k_sub25':                 `${BASE}/5k_sub25.png`,
  '10k':                      `${BASE}/10k.png`,
  'half':                     `${BASE}/half.png`,
  'marathon_advanced':        `${BASE}/marathon_advanced.png`,

  // ── Hyrox ────────────────────────────────────────────────
  'hyrox_12w':                `${BASE}/hyrox_12w.png`,
  'hyrox_8w':                 `${BASE}/hyrox_8w.png`,
  'hyrox_elite':              `${BASE}/hyrox_elite.png`,

  // ── Hybrid ───────────────────────────────────────────────
  'strength_run':             `${BASE}/strength_run.png`,
  'upper_lower_run':          `${BASE}/upper_lower_run.png`,
  'balanced_hybrid':          `${BASE}/balanced_hybrid.png`,
  'ppl_hyrox':                `${BASE}/ppl_hyrox.png`,
  'hybrid_foundation':        `${BASE}/hybrid_foundation.png`,
  'tactical_hybrid':          `${BASE}/tactical_hybrid.png`,

  // ── MetCon ───────────────────────────────────────────────
  'metcon_foundations':       `${BASE}/metcon_foundations.png`,
  'metcon_performance':       `${BASE}/metcon_performance.png`,
  'metcon_elite':             `${BASE}/metcon_elite.png`,

  // ── Sport ────────────────────────────────────────────────
  'athletic_base':            `${BASE}/athletic_base.png`,

  // ── Glute Focus ──────────────────────────────────────────
  'glute_builder':            `${BASE}/glute_builder.png`,
  'glute_hamstring':          `${BASE}/glute_hamstring.png`,
  'glute_3':                  `${BASE}/glute_3.png`,
  'glute_4':                  `${BASE}/glute_4.png`,
  'lower_5':                  `${BASE}/lower_5.png`,
};

export function getProgramImage(programId) {
  if (!programId) return null;
  const key = programId.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  return PROGRAM_IMAGES[key] ?? null;
}
