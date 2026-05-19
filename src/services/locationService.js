export async function geocodeCity(cityName) {
  const url = `/api/places?endpoint=geocode&address=${encodeURIComponent(cityName)}`;
  const res = await fetch(url);
  const data = await res.json();
  const loc = data.results?.[0]?.geometry?.location;
  if (!loc) return null;
  return { lat: loc.lat, lng: loc.lng };
}

export async function getNearbyRestaurants(lat, lng, radius = 2000) {
  const url = `/api/places?endpoint=nearbysearch&location=${lat},${lng}&radius=${radius}&type=restaurant`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}
