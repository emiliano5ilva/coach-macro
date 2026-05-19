const PLACES_PROXY = import.meta.env.VITE_API_BASE_URL || 'https://www.coach-macro.com';

export async function geocodeCity(cityName) {
  const url = `${PLACES_PROXY}/api/places?endpoint=geocode&address=${encodeURIComponent(cityName)}`;
  const res = await fetch(url);
  const data = await res.json();
  const loc = data.results?.[0]?.geometry?.location;
  if (!loc) return null;
  return { lat: loc.lat, lng: loc.lng };
}

export async function getNearbyRestaurants(lat, lng, radius = 2000) {
  const url = `${PLACES_PROXY}/api/places?endpoint=nearbysearch&location=${lat},${lng}&radius=${radius}&type=restaurant`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}
