const CACHE_KEY = 'cm_weather_pace_cache';
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function getWeatherPaceAdjustment(latitude, longitude) {
  // Return cached result if still fresh
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw);
      if (Date.now() - cached.ts < CACHE_TTL_MS) {
        return cached.data;
      }
    }
  } catch {}

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m` +
      `&forecast_days=1`
    );
    const data = await res.json();
    const temp     = data.current?.temperature_2m ?? 15;
    const humidity = data.current?.relative_humidity_2m ?? 50;

    const humidityPenalty = humidity > 70 ? 0.02 : humidity > 60 ? 0.01 : 0;

    const heatFactor =
      temp < 15 ? 1.00 :
      temp < 20 ? 1.02 :
      temp < 25 ? 1.04 :
      temp < 30 ? 1.07 :
      temp < 35 ? 1.11 :
      1.15;

    const totalFactor = Math.round((heatFactor + humidityPenalty) * 1000) / 1000;

    const result = {
      tempC: Math.round(temp),
      humidity: Math.round(humidity),
      adjustmentFactor: totalFactor,
      note: totalFactor > 1.04
        ? `${Math.round(temp)}°C today — your paces are adjusted for the heat. This is correct physiology, not weakness. Do not chase your normal paces.`
        : null,
    };

    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: result })); } catch {}
    return result;
  } catch {
    return { tempC: null, humidity: null, adjustmentFactor: 1.0, note: null };
  }
}

export function applyWeatherToPaces(paces, adjustmentFactor) {
  if (!paces || adjustmentFactor <= 1.0) return paces;
  return Object.fromEntries(
    Object.entries(paces).map(([k, v]) => [k, Math.round(v * adjustmentFactor)])
  );
}
