import React from 'react';

export default function FeatureUnlockCard({ unlock, onShowMe, onDismiss }) {
  const { feature } = unlock;

  return (
    <div style={{ background: '#0d0d0d', border: '1px solid rgba(232,52,28,0.25)', borderRadius: 14, padding: 16, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
      {/* Red atmospheric glow */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,52,28,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Eyebrow */}
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#e8341c', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>
        {'// NEW UNLOCK 🔓'}
      </div>

      {/* Emoji + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 24 }}>{feature.emoji}</span>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontStyle: 'italic', fontWeight: 900, fontSize: 22, color: '#f5f5f0', lineHeight: 1, textTransform: 'uppercase' }}>
          {feature.title.replace(/\.$/, '')}<span style={{ color: '#e8341c' }}>.</span>
        </div>
      </div>

      {/* Description */}
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, color: 'rgba(245,245,240,0.6)', lineHeight: 1.5, marginBottom: 14 }}>
        {feature.description}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onShowMe}
          style={{ flex: 2, background: '#e8341c', border: 'none', borderRadius: 10, padding: '11px 0', fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 10, color: '#fff', letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          SHOW ME →
        </button>
        <button
          onClick={onDismiss}
          style={{ flex: 1, background: 'transparent', border: '1px solid rgba(245,245,240,0.1)', borderRadius: 10, padding: '11px 0', fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'rgba(245,245,240,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          LATER
        </button>
      </div>
    </div>
  );
}
