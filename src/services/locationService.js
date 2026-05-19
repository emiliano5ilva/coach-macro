export async function geocodeCity(cityName) {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_KEY;
  console.log('Places key:', apiKey ? 'SET' : 'MISSING');
  if (!apiKey) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityName)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  const loc = data.results?.[0]?.geometry?.location;
  if (!loc) return null;
  return { lat: loc.lat, lng: loc.lng };
}

export async function getNearbyRestaurants(lat, lng) {
  const apiKey = import.meta.env.VITE_GOOGLE_PLACES_KEY;
  if (!apiKey) return [];
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=2000&type=restaurant&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}
