// Accepts units as 'imperial'/'lbs' or 'metric'/'kg'
function isMetric(units) {
  return units === 'metric' || units === 'kg';
}

// Lifted weight — stored as lbs in DB
export function displayWeight(lbs, units) {
  if (lbs == null) return null;
  if (isMetric(units)) {
    const kg = lbs * 0.453592;
    return `${kg.toFixed(1)} kg`;
  }
  return `${Number(lbs).toFixed(0)} lbs`;
}

// Compact lifted weight for big numbers (passport, volume totals)
export function displayWeightCompact(lbs, units) {
  if (lbs == null) return null;
  const val = isMetric(units) ? lbs * 0.453592 : lbs;
  const unit = isMetric(units) ? 'kg' : 'lbs';
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M ${unit}`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K ${unit}`;
  return `${val.toFixed(0)} ${unit}`;
}

// Distance — stored as km in DB
export function displayDistance(km, units) {
  if (km == null) return null;
  if (!isMetric(units)) {
    const miles = km * 0.621371;
    return `${miles.toFixed(1)} mi`;
  }
  return `${km.toFixed(1)} km`;
}

// Pace
export function displayPace(secondsPerKm, units) {
  if (!secondsPerKm) return null;
  if (!isMetric(units)) {
    const secPerMile = secondsPerKm * 1.609344;
    const m = Math.floor(secPerMile / 60);
    const s = Math.round(secPerMile % 60);
    return `${m}:${s.toString().padStart(2, '0')}/mi`;
  }
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.round(secondsPerKm % 60);
  return `${m}:${s.toString().padStart(2, '0')}/km`;
}

// Body weight — stored as kg in DB
export function displayBodyWeight(kg, units) {
  if (kg == null) return null;
  if (!isMetric(units)) {
    const lbs = kg * 2.20462;
    return `${lbs.toFixed(1)} lbs`;
  }
  return `${kg.toFixed(1)} kg`;
}

export function distanceLabel(units) {
  return isMetric(units) ? 'km' : 'mi';
}

export function weightLabel(units) {
  return isMetric(units) ? 'kg' : 'lbs';
}

export function bodyWeightLabel(units) {
  return isMetric(units) ? 'kg' : 'lbs';
}

export function runDistanceStatLabel(units) {
  return isMetric(units) ? 'Total km run' : 'Total miles run';
}
