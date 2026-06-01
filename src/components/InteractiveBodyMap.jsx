import React, { useState, useCallback } from 'react';
import BodyMap from './BodyMap';

// ── Zone definitions ──────────────────────────────────────────────────────────

// Zones that offer a L/R/Both pill after tap
const BILATERAL_ZONES = new Set([
  'quads','hamstrings','glutes','calves-f','calves-b',
  'biceps','triceps','forearms-f','forearms-b','shoulders-f','rear-delts',
]);

// All selectable zones
const ALL_ZONES = [
  'chest','abs','lats','traps','lower-back','hip-flexors',
  'quads','hamstrings','glutes','calves-f','calves-b',
  'biceps','triceps','forearms-f','forearms-b','shoulders-f','rear-delts',
];

// Map a stored zone key (may include _L/_R) to BodyMap SVG group ID
function zoneToGroupId(zone) {
  return zone.replace(/_L$/, '').replace(/_R$/, '');
}

// Cycle: null → secondary → primary → null
function cycleState(current) {
  if (current === null) return 'secondary';
  if (current === 'secondary') return 'primary';
  return null;
}

// Colors passed to BodyMap
const COLOR_PRIMARY   = '#FF3B30';
const COLOR_SECONDARY = 'rgba(255,140,0,0.70)';
const COLOR_DEFAULT   = '#2a2a2a';

// Front zones / back zones for the toggle
const FRONT_ZONES = ['chest','abs','hip-flexors','quads','calves-f','biceps','forearms-f','shoulders-f'];
const BACK_ZONES  = ['lats','traps','lower-back','rear-delts','glutes','hamstrings','calves-b','triceps','forearms-b'];

// Approximate hit-box centres for the pill overlay (relative to viewBox 0 0 1048 1032)
// These are approximate centroids of each zone's SVG group
const ZONE_CENTROIDS = {
  chest:         { x: 290, y: 250 },
  'shoulders-f': { x: 195, y: 290 },
  biceps:        { x: 192, y: 340 },
  'forearms-f':  { x: 163, y: 410 },
  abs:           { x: 290, y: 395 },
  'hip-flexors': { x: 290, y: 560 },
  quads:         { x: 290, y: 610 },
  'calves-f':    { x: 290, y: 820 },
  traps:         { x: 755, y: 290 },
  'rear-delts':  { x: 660, y: 290 },
  triceps:       { x: 648, y: 340 },
  'forearms-b':  { x: 645, y: 415 },
  lats:          { x: 755, y: 510 },
  'lower-back':  { x: 797, y: 530 },
  glutes:        { x: 755, y: 640 },
  hamstrings:    { x: 755, y: 750 },
  'calves-b':    { x: 755, y: 850 },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function InteractiveBodyMap({ onChange }) {
  const [view, setView] = useState('front'); // 'front' | 'back'
  // Map from zone key → 'primary' | 'secondary' | null
  // Zone key can be "quads", "quads_L", "quads_R"
  const [zoneStates, setZoneStates] = useState({});
  // Pending bilateral zone waiting for L/Both/R choice
  const [pendingBilateral, setPendingBilateral] = useState(null); // zone base name or null

  // Derive primary/secondary arrays from zoneStates
  const computeOutputs = useCallback((states) => {
    const primary = [];
    const secondary = [];
    Object.entries(states).forEach(([zone, state]) => {
      if (state === 'primary')   primary.push(zone);
      if (state === 'secondary') secondary.push(zone);
    });
    return { primary, secondary };
  }, []);

  // Fire onChange after every mutation
  const applyAndNotify = useCallback((newStates) => {
    setZoneStates(newStates);
    const { primary, secondary } = computeOutputs(newStates);
    onChange?.(primary, secondary);
  }, [computeOutputs, onChange]);

  // Handle tap on a zone base name (no _L/_R yet)
  function handleZoneTap(baseZone) {
    if (BILATERAL_ZONES.has(baseZone)) {
      // First check: is any variant already selected?
      const variants = [baseZone, `${baseZone}_L`, `${baseZone}_R`];
      const existingKey = variants.find(v => zoneStates[v]);
      if (existingKey) {
        // Cycle the existing selection
        const next = cycleState(zoneStates[existingKey]);
        const newStates = { ...zoneStates };
        if (next === null) {
          delete newStates[existingKey];
        } else {
          newStates[existingKey] = next;
        }
        applyAndNotify(newStates);
      } else {
        // New tap — show bilateral pill
        setPendingBilateral(baseZone);
      }
    } else {
      // Unilateral — cycle directly
      const current = zoneStates[baseZone] ?? null;
      const next = cycleState(current);
      const newStates = { ...zoneStates };
      if (next === null) delete newStates[baseZone];
      else newStates[baseZone] = next;
      applyAndNotify(newStates);
    }
  }

  // Bilateral pill choice
  function handleBilateralChoice(choice) {
    if (!pendingBilateral) return;
    const base = pendingBilateral;
    const newStates = { ...zoneStates };
    // Clear any existing variants
    [base, `${base}_L`, `${base}_R`].forEach(v => delete newStates[v]);
    const key = choice === 'L' ? `${base}_L` : choice === 'R' ? `${base}_R` : base;
    newStates[key] = 'secondary'; // starts as secondary
    setPendingBilateral(null);
    applyAndNotify(newStates);
  }

  // Build BodyMap color dict — worst-case (primary beats secondary)
  const bodyColors = {};
  ALL_ZONES.forEach(zone => {
    bodyColors[zone] = COLOR_DEFAULT;
  });
  Object.entries(zoneStates).forEach(([zone, state]) => {
    const groupId = zoneToGroupId(zone);
    const color = state === 'primary' ? COLOR_PRIMARY : COLOR_SECONDARY;
    // Primary always wins
    if (!bodyColors[groupId] || bodyColors[groupId] === COLOR_DEFAULT || bodyColors[groupId] === COLOR_SECONDARY) {
      bodyColors[groupId] = color;
    }
  });

  // Which zones are visible in current view
  const visibleZones = view === 'front' ? FRONT_ZONES : BACK_ZONES;

  // State display for a base zone (looks at all variants)
  function getZoneDisplay(baseZone) {
    const variants = [baseZone, `${baseZone}_L`, `${baseZone}_R`];
    const active = variants.find(v => zoneStates[v]);
    if (!active) return null;
    return { key: active, state: zoneStates[active] };
  }

  function handleClearAll() {
    setPendingBilateral(null);
    applyAndNotify({});
  }

  const pendingCentroid = pendingBilateral ? ZONE_CENTROIDS[pendingBilateral] : null;

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      {/* Feeling great button */}
      <button
        onClick={handleClearAll}
        style={{
          width: '100%', marginBottom: 12, padding: '10px 16px',
          background: 'transparent',
          border: '1.5px solid rgba(245,245,240,0.35)',
          borderRadius: 10, color: '#f5f5f0',
          fontFamily: "'Barlow Condensed',sans-serif",
          fontWeight: 700, fontStyle: 'italic',
          fontSize: 15, cursor: 'pointer', letterSpacing: '0.04em',
          textTransform: 'uppercase', transition: 'border-color 0.15s',
        }}
      >
        Feeling great — clear all
      </button>

      {/* Front / Back tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: '1px solid rgba(245,245,240,0.08)' }}>
        {['front', 'back'].map(v => (
          <button
            key={v}
            onClick={() => { setView(v); setPendingBilateral(null); }}
            style={{
              flex: 1, padding: '9px 0', background: 'none', border: 'none',
              borderBottom: view === v ? '2px solid #FF3B30' : '2px solid transparent',
              color: view === v ? '#FF3B30' : 'rgba(245,245,240,0.45)',
              fontFamily: "'DM Mono','SF Mono',monospace",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', cursor: 'pointer', marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Body map + hit overlay */}
      <div style={{ position: 'relative', backgroundColor: '#000', borderRadius: 10, padding: 8 }}>
        <BodyMap colors={bodyColors} />

        {/* Transparent SVG hit layer */}
        <svg
          viewBox="0 0 1048 1032"
          width="100%" height="auto"
          style={{ position: 'absolute', top: 8, left: 8, width: 'calc(100% - 16px)', cursor: 'pointer' }}
        >
          {visibleZones.map(zone => {
            const disp = getZoneDisplay(zone);
            const state = disp?.state ?? null;
            return (
              <ZoneHitArea
                key={zone}
                zone={zone}
                view={view}
                state={state}
                onTap={() => handleZoneTap(zone)}
              />
            );
          })}

          {/* Bilateral pill overlay */}
          {pendingBilateral && pendingCentroid && (
            <BilateralPill
              x={pendingCentroid.x}
              y={pendingCentroid.y}
              onChoice={handleBilateralChoice}
              onDismiss={() => setPendingBilateral(null)}
            />
          )}
        </svg>
      </div>

      {/* Zone chip legend */}
      {Object.keys(zoneStates).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {Object.entries(zoneStates).map(([zone, state]) => (
            <span
              key={zone}
              onClick={() => handleZoneTap(zoneToGroupId(zone))}
              style={{
                padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
                background: state === 'primary' ? 'rgba(255,59,48,0.15)' : 'rgba(255,140,0,0.12)',
                border: `1px solid ${state === 'primary' ? 'rgba(255,59,48,0.4)' : 'rgba(255,140,0,0.35)'}`,
                color: state === 'primary' ? '#FF3B30' : '#FF8C00',
                fontFamily: "'DM Mono',monospace", fontSize: 9,
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}
            >
              {zone.replace(/_/g, ' ')} · {state}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Zone hit-area rectangles (approximate bounding boxes per group) ────────────
// These rectangles sit over the SVG body paths and capture taps.
// Coordinates are in viewBox 0 0 1048 1032 space.

const FRONT_HITBOXES = {
  chest:         { x: 215, y: 205, w: 175, h: 110 },
  'shoulders-f': { x: 163, y: 255, w:  60, h:  75 },
  biceps:        { x: 155, y: 310, w:  65, h:  60 },
  'forearms-f':  { x: 118, y: 358, w:  80, h: 140 },
  abs:           { x: 216, y: 310, w: 150, h: 210 },
  'hip-flexors': { x: 250, y: 510, w:  90, h:  95 },
  quads:         { x: 185, y: 500, w: 175, h: 240 },
  'calves-f':    { x: 185, y: 785, w: 175, h: 155 },
};
const BACK_HITBOXES = {
  traps:         { x: 685, y: 195, w: 175, h: 265 },
  'rear-delts':  { x: 628, y: 205, w:  70, h:  95 },
  triceps:       { x: 625, y: 310, w:  60, h:  60 },
  'forearms-b':  { x: 583, y: 360, w:  80, h: 140 },
  lats:          { x: 650, y: 500, w: 205, h:  85 },
  'lower-back':  { x: 755, y: 500, w:  85, h:  55 },
  glutes:        { x: 650, y: 535, w: 200, h: 180 },
  hamstrings:    { x: 655, y: 705, w: 200, h: 100 },
  'calves-b':    { x: 660, y: 795, w: 190, h: 155 },
};

function ZoneHitArea({ zone, view, state, onTap }) {
  const boxes = view === 'front' ? FRONT_HITBOXES : BACK_HITBOXES;
  const box = boxes[zone];
  if (!box) return null;
  return (
    <rect
      x={box.x} y={box.y} width={box.w} height={box.h}
      fill="transparent"
      stroke={state === 'primary' ? 'rgba(255,59,48,0.5)' : state === 'secondary' ? 'rgba(255,140,0,0.4)' : 'transparent'}
      strokeWidth={state ? 2 : 0}
      rx={6}
      onClick={onTap}
      style={{ cursor: 'pointer' }}
    />
  );
}

// ── Bilateral pill rendered in SVG space ──────────────────────────────────────

function BilateralPill({ x, y, onChoice, onDismiss }) {
  const pillW = 210, pillH = 36, pillR = 18;
  const px = Math.max(pillW / 2 + 10, Math.min(1048 - pillW / 2 - 10, x)) - pillW / 2;
  const py = Math.max(10, y - pillH - 14);
  const btnW = pillW / 3;

  return (
    <g>
      {/* Dismiss backdrop */}
      <rect x={0} y={0} width={1048} height={1032} fill="transparent" onClick={onDismiss} />
      {/* Pill background */}
      <rect x={px} y={py} width={pillW} height={pillH} rx={pillR}
        fill="#1a1a1a" stroke="rgba(245,245,240,0.35)" strokeWidth={1.5} />
      {/* Left */}
      <text x={px + btnW * 0.5} y={py + pillH / 2 + 5}
        textAnchor="middle" fill="#f5f5f0"
        fontFamily="'Barlow Condensed',sans-serif" fontWeight={700} fontSize={13}
        style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onChoice('L'); }}>
        ← Left
      </text>
      {/* Divider */}
      <line x1={px + btnW} y1={py + 6} x2={px + btnW} y2={py + pillH - 6}
        stroke="rgba(245,245,240,0.2)" strokeWidth={1} />
      {/* Both */}
      <text x={px + btnW * 1.5} y={py + pillH / 2 + 5}
        textAnchor="middle" fill="#f5f5f0"
        fontFamily="'Barlow Condensed',sans-serif" fontWeight={700} fontSize={13}
        style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onChoice('both'); }}>
        Both
      </text>
      {/* Divider */}
      <line x1={px + btnW * 2} y1={py + 6} x2={px + btnW * 2} y2={py + pillH - 6}
        stroke="rgba(245,245,240,0.2)" strokeWidth={1} />
      {/* Right */}
      <text x={px + btnW * 2.5} y={py + pillH / 2 + 5}
        textAnchor="middle" fill="#f5f5f0"
        fontFamily="'Barlow Condensed',sans-serif" fontWeight={700} fontSize={13}
        style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onChoice('R'); }}>
        Right →
      </text>
    </g>
  );
}
