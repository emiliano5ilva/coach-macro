import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const ACCENT = '#FF3B30';

let _styleInjected = false;
function injectStyles() {
  if (_styleInjected || typeof document === 'undefined') return;
  _styleInjected = true;
  const s = document.createElement('style');
  s.textContent = [
    '@keyframes _cmGpsPulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.9);opacity:0}}',
    '@keyframes _cmLiveBlink{0%,100%{opacity:1}50%{opacity:.3}}',
    '.mapboxgl-ctrl-attrib-button{display:none!important}',
    '.mapboxgl-ctrl-attrib.mapboxgl-compact{min-height:0!important;padding:0 2px!important;font-size:8px!important;opacity:.5}',
    // Hide the bottom-left control corner (logo moved to bottom-right)
    '.mapboxgl-ctrl-bottom-left{display:none!important}',
  ].join('');
  document.head.appendChild(s);
}

function emptyLine() {
  return { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } };
}

function coordsToLngLat(coords) {
  return coords.map(c => [c.lon, c.lat]);
}

// Subsample coords array to maxN points, always keeping first and last.
function subsample(coords, maxN) {
  if (coords.length <= maxN) return coords;
  const step = (coords.length - 1) / (maxN - 1);
  return Array.from({ length: maxN }, (_, i) => coords[Math.round(i * step)]);
}

function createPositionMarker(accentColor) {
  const el = document.createElement('div');
  el.style.cssText = 'width:28px;height:28px;position:relative;pointer-events:none;';
  el.innerHTML =
    `<div style="position:absolute;inset:0;border-radius:50%;background:${accentColor};` +
    `animation:_cmGpsPulse 1.6s ease-in-out infinite;"></div>` +
    `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);` +
    `width:14px;height:14px;border-radius:50%;background:${accentColor};` +
    `border:2.5px solid #fff;box-shadow:0 2px 10px rgba(255,59,48,.55);"></div>`;
  return el;
}

// POST coords to Mapbox Map Matching API and snap the route to actual roads/paths.
// Subsamples to ≤80 points (API limit is 100). Silently falls back to raw coords on error.
async function fetchMatchedRoute(coords) {
  if (!TOKEN || coords.length < 2) return null;
  const sample = subsample(coords, 80);
  const body = new URLSearchParams({
    coordinates: sample.map(c => `${c.lon.toFixed(6)},${c.lat.toFixed(6)}`).join(';'),
    radiuses:    Array(sample.length).fill('25').join(';'),
    geometries:  'geojson',
  });
  try {
    const res = await fetch(
      `https://api.mapbox.com/matching/v5/mapbox/walking?access_token=${TOKEN}`,
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.code !== 'Ok' || !data.matchings?.[0]?.geometry) return null;
    if ((data.matchings[0].confidence ?? 1) < 0.2) return null;
    return data.matchings[0].geometry; // GeoJSON LineString
  } catch {
    return null;
  }
}

// props:
//   coords     — [{lat, lon, alt?, ts?}] — live array from the GPS watcher
//   active     — show "GPS LIVE" pill (true during run, false on summary)
//   fitBounds  — zoom to show the full route (true on summary view)
//   height     — map container height CSS value
export default function RunMap({ coords = [], active = true, fitBounds = false, height = 'min(58vh, 340px)' }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);
  const readyRef     = useRef(false);

  // Always-current refs so map.on('load') closure sees the latest props.
  const latestCoordsRef    = useRef(coords);
  const latestFitBoundsRef = useRef(fitBounds);
  latestCoordsRef.current    = coords;
  latestFitBoundsRef.current = fitBounds;

  // ── Map init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;

    injectStyles();
    mapboxgl.accessToken = TOKEN;

    const accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--cm-accent').trim() || ACCENT;

    const map = new mapboxgl.Map({
      container:       containerRef.current,
      style:           'mapbox://styles/mapbox/dark-v11',
      center:          [0, 0],
      zoom:            16.5,
      interactive:     !active,
      pitchWithRotate: false,
      dragRotate:      false,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    // ResizeObserver: whenever the container size changes (layout paint, scroll into view,
    // orientation change) call map.resize() so the GL canvas matches and tiles load correctly.
    const ro = new ResizeObserver(() => { mapRef.current?.resize(); });
    ro.observe(containerRef.current);

    map.on('load', () => {
      map.addSource('run-route', { type: 'geojson', data: emptyLine() });

      map.addLayer({
        id: 'run-halo', type: 'line', source: 'run-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': accentColor, 'line-width': 20, 'line-opacity': 0.30, 'line-blur': 6 },
      });

      map.addLayer({
        id: 'run-line', type: 'line', source: 'run-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': accentColor, 'line-width': 6, 'line-opacity': 0.93 },
      });

      markerRef.current = new mapboxgl.Marker({ element: createPositionMarker(accentColor), anchor: 'center' })
        .setLngLat([0, 0])
        .addTo(map);

      // Force a resize now so the canvas picks up the container's actual pixel dimensions.
      // Without this the canvas can be 0×0 on summary mount, preventing tile loads.
      map.resize();
      setTimeout(() => map.resize(), 120);

      readyRef.current = true;

      // Populate immediately if coords were passed as initial props (summary view).
      const initialCoords = latestCoordsRef.current;
      if (initialCoords.length > 0) {
        const lngLats = coordsToLngLat(initialCoords);
        const latest  = lngLats[lngLats.length - 1];
        map.getSource('run-route')?.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: lngLats } });
        markerRef.current?.setLngLat(latest);

        if (latestFitBoundsRef.current && lngLats.length >= 2) {
          const bounds = lngLats.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(lngLats[0], lngLats[0]));
          map.fitBounds(bounds, { padding: 52, duration: 900, maxZoom: 17 });
        } else {
          map.jumpTo({ center: latest, zoom: 16.5 });
        }
      }
    });

    mapRef.current = map;

    return () => {
      ro.disconnect();
      readyRef.current  = false;
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Live run: update route + position on new coords ──────────────────────
  useEffect(() => {
    if (!readyRef.current || !mapRef.current || coords.length === 0) return;
    const lngLats = coordsToLngLat(coords);
    const latest  = lngLats[lngLats.length - 1];
    mapRef.current.getSource('run-route')?.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: lngLats } });
    markerRef.current?.setLngLat(latest);
    if (!fitBounds) mapRef.current.easeTo({ center: latest, duration: 350 });
  }, [coords, fitBounds]);

  // ── Jump to first fix ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!readyRef.current || !mapRef.current || coords.length !== 1) return;
    mapRef.current.jumpTo({ center: [coords[0].lon, coords[0].lat], zoom: 16.5 });
  }, [coords.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Summary: fit full route + snap to roads via Map Matching ─────────────
  useEffect(() => {
    if (!fitBounds || coords.length < 2) return;

    // Fit bounds (uses raw coords immediately, snapped route replaces once API returns).
    const fit = () => {
      if (!readyRef.current || !mapRef.current) return;
      const lngLats = coordsToLngLat(coords);
      const bounds  = lngLats.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(lngLats[0], lngLats[0]));
      mapRef.current.fitBounds(bounds, { padding: 52, duration: 900, maxZoom: 17 });
    };

    if (readyRef.current) {
      fit();
    } else {
      // Map not loaded yet — schedule fit for after load fires.
      const check = setInterval(() => { if (readyRef.current) { fit(); clearInterval(check); } }, 50);
      setTimeout(() => clearInterval(check), 3000); // give up after 3s
    }

    // Map Matching: snap route to actual roads, replaces raw straight-line segments.
    fetchMatchedRoute(coords).then(geom => {
      if (!geom || !mapRef.current) return;
      // Wait for map to be ready if it isn't yet.
      const apply = () => mapRef.current?.getSource('run-route')?.setData({ type: 'Feature', geometry: geom });
      if (readyRef.current) apply();
      else { const t = setInterval(() => { if (readyRef.current) { apply(); clearInterval(t); } }, 50); setTimeout(() => clearInterval(t), 3000); }
    });
  }, [fitBounds]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!TOKEN) return null;

  return (
    <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.30)' }}>
      <div ref={containerRef} style={{ width: '100%', height }} />

      {active && (
        <div style={{
          position: 'absolute', top: 12, left: 12,
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(0,0,0,0.62)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 20, padding: '6px 13px 6px 10px', zIndex: 10,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT, display: 'inline-block', flexShrink: 0, animation: '_cmLiveBlink 1.4s ease-in-out infinite' }} />
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase' }}>GPS LIVE</span>
        </div>
      )}
    </div>
  );
}
