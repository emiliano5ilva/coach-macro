// ─────────────────────────────────────────────────────────────────────────────
// GPS ACCURACY FILTER — turns jittery raw CLLocationManager points into trustworthy
// distance + pace. Pure + stateful (no imports, no globals) so it's node-testable in isolation.
//
// Pipeline per incoming fix:
//   1. ACCURACY FLOOR   — drop points worse than the floor (20 m; relaxed to 30 m after a signal gap
//                         so tracking doesn't stall).
//   2. SPIKE GATE       — drop a fix whose implied speed from the committed position exceeds 12 m/s
//                         (~2:19/km) — a teleport from one bad fix — BEFORE it can pollute the smoother.
//   3. EMA SMOOTHING    — low-pass the position (accuracy-weighted α). Wobble averages out toward its
//                         centre; a straight run tracks the line (distance preserved once converged).
//   4. MIN-DISTANCE GATE— accumulate only once the SMOOTHED position clears max(8 m, accuracy) from the
//                         last committed point, so a stationary wobble (spread ≈ accuracy) adds nothing.
// Pace: 20 s ROLLING WINDOW (distance ÷ span), never point-to-point. Average pace = total ÷ elapsed.
// ─────────────────────────────────────────────────────────────────────────────

const R = 6371000; // Earth radius (m)
function haversineM(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const GPS_DEFAULTS = {
  accuracyFloor: 20,   // m — reject fixes worse than this
  accuracyRelax: 30,   // m — relaxed floor after a signal gap
  relaxAfterMs: 10000, // ms without an accepted fix → relax the floor
  minStepM: 8,         // m — jitter-gate floor
  accStepMult: 1.0,    // jitter step scales with error: required = max(minStepM, accStepMult*accuracy)
  maxSpeedMps: 12,     // m/s — spike gate
  baseAlpha: 0.5,      // EMA smoothing at reference accuracy; scaled by (accuracyFloor/accuracy)
  paceWindowS: 20,     // s — rolling window for "current" pace
};

// Feed each raw fix to .push({ latitude, longitude, accuracy, time(epoch ms) }). Returns
// { accepted, reason, addedMeters, totalMeters, totalKm, currentPaceSecPerKm, avgPaceSecPerKm }.
export function createGpsFilter(opts = {}) {
  const C = { ...GPS_DEFAULTS, ...opts };
  let ema = null;         // low-pass-smoothed position { lat, lon }
  let committed = null;   // last position we accumulated distance to (snapshot of ema)
  let startTime = null, lastAcceptTime = null, lastRaw = null, firstSeenTime = null;
  let totalMeters = 0;
  const win = [];         // rolling window of accepted { time, cum } (cum = totalMeters after that point)

  const result = (now, accepted, reason, added) => {
    // keep one entry just OUTSIDE the window as the span origin so distance/span align
    while (win.length > 1 && now - win[1].time > C.paceWindowS * 1000) win.shift();
    let currentPaceSecPerKm = null;
    if (win.length >= 2) {
      const dist = totalMeters - win[0].cum, span = (now - win[0].time) / 1000;
      if (dist > 5 && span > 0) currentPaceSecPerKm = span / (dist / 1000);
    }
    const totalS = startTime != null ? (now - startTime) / 1000 : 0;
    const avgPaceSecPerKm = totalMeters > 5 && totalS > 0 ? totalS / (totalMeters / 1000) : null;
    return { accepted, reason, addedMeters: added || 0, totalMeters, totalKm: totalMeters / 1000, currentPaceSecPerKm, avgPaceSecPerKm };
  };

  return {
    push(pt) {
      const lat = pt.latitude, lon = pt.longitude, acc = pt.accuracy, time = pt.time;
      if (firstSeenTime == null) firstSeenTime = time;
      // 1. accuracy floor (relaxed after a gap)
      const sinceAccept = lastAcceptTime != null ? time - lastAcceptTime : time - firstSeenTime;
      const floor = sinceAccept > C.relaxAfterMs ? C.accuracyRelax : C.accuracyFloor;
      if (acc == null || !isFinite(acc) || acc > floor) return result(time, false, "accuracy", 0);
      // 2. spike gate — instantaneous speed between CONSECUTIVE raw fixes (same time base). A rejected
      // spike does NOT advance lastRaw, so the following genuine fix isn't judged against the teleport.
      if (lastRaw) {
        const draw = haversineM(lastRaw.lat, lastRaw.lon, lat, lon);
        const dt = (time - lastRaw.time) / 1000;
        if (dt > 0 && draw / dt > C.maxSpeedMps) return result(time, false, "spike", 0);
      }
      lastRaw = { lat, lon, time };
      // 3. EMA smoothing — better accuracy → trust the raw point more
      const alpha = clamp(C.baseAlpha * (C.accuracyFloor / Math.max(acc, 3)), 0.15, 0.85);
      ema = ema ? { lat: ema.lat + alpha * (lat - ema.lat), lon: ema.lon + alpha * (lon - ema.lon) } : { lat, lon };
      if (!committed) {
        committed = { ...ema }; startTime = time; lastAcceptTime = time; win.push({ time, cum: 0 });
        return result(time, true, "anchor", 0);
      }
      // 4. min-distance gate on the SMOOTHED position (scales with error radius)
      const d = haversineM(committed.lat, committed.lon, ema.lat, ema.lon);
      if (d < Math.max(C.minStepM, C.accStepMult * acc)) return result(time, false, "jitter", 0);
      totalMeters += d;
      committed = { ...ema }; lastAcceptTime = time;
      win.push({ time, cum: totalMeters });
      return result(time, true, "accept", d);
    },
  };
}
