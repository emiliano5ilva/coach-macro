// Gradient A: cold (blue/fresh) → hot (yellow/fatigued). Single source of truth.

export const THERMAL_STOPS = [
  { t: 0.00, c: '#0A6CFF' }, // blue   — cold / skipped / fresh
  { t: 0.20, c: '#3A4DDB' }, // indigo
  { t: 0.40, c: '#7A2FB0' }, // purple
  { t: 0.62, c: '#CC1100' }, // red    — optimal / primed
  { t: 0.82, c: '#FF7A00' }, // orange
  { t: 1.00, c: '#FFE500' }, // yellow — hot / overloaded / fatigued
];

export const THERMAL_NODATA = '#2a2a2a';

export const THERMAL_CSS = 'linear-gradient(to right,#0A6CFF,#3A4DDB,#7A2FB0,#CC1100,#FF7A00,#FFE500)';

function hexToRgb(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}
function toHex(n) { return Math.round(n).toString(16).padStart(2,'0'); }

export function thermalAt(t) {
  const v = Math.max(0, Math.min(1, t));
  let lo = THERMAL_STOPS[0];
  let hi = THERMAL_STOPS[THERMAL_STOPS.length - 1];
  for (let i = 0; i < THERMAL_STOPS.length - 1; i++) {
    if (v >= THERMAL_STOPS[i].t && v <= THERMAL_STOPS[i+1].t) {
      lo = THERMAL_STOPS[i]; hi = THERMAL_STOPS[i+1]; break;
    }
  }
  const span = hi.t - lo.t;
  const f = span === 0 ? 0 : (v - lo.t) / span;
  const [r1,g1,b1] = hexToRgb(lo.c);
  const [r2,g2,b2] = hexToRgb(hi.c);
  return `#${toHex(r1+f*(r2-r1))}${toHex(g1+f*(g2-g1))}${toHex(b1+f*(b2-b1))}`;
}
