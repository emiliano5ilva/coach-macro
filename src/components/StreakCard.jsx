import React from 'react';

export default function StreakCard({ win, streak, onDismiss }) {
  if (!win) return null;

  return (
    <div style={{
      margin: '0 20px 12px',
      background: '#0d0d0d',
      border: '1px solid rgba(232,52,28,0.25)',
      borderRadius: 14,
      padding: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 120, height: 120, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232,52,28,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute', top: 10, right: 12,
          background: 'none', border: 'none',
          fontFamily: 'DM Mono, monospace', fontSize: 11,
          color: 'rgba(245,245,240,0.25)', cursor: 'pointer', padding: 4,
        }}
      >
        ×
      </button>

      {/* Eyebrow */}
      <div style={{
        fontFamily: 'DM Mono, monospace', fontSize: 9,
        color: '#e8341c', letterSpacing: '0.16em',
        textTransform: 'uppercase', marginBottom: 6,
      }}>
        {'// STREAK MILESTONE 🔥'}
      </div>

      {/* Emoji + Streak */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 24 }}>{win.emoji}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontStyle: 'italic', fontWeight: 900,
            fontSize: 36, color: '#e8341c', lineHeight: 1,
          }}>
            {streak}
          </span>
          <span style={{
            fontFamily: 'DM Mono, monospace', fontSize: 8,
            color: 'rgba(245,245,240,0.4)', letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            DAY STREAK
          </span>
        </div>
      </div>

      {/* Headline */}
      <div style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontStyle: 'italic', fontWeight: 900,
        fontSize: 20, color: '#f5f5f0',
        lineHeight: 1, textTransform: 'uppercase', marginBottom: 6,
      }}>
        {win.headline.replace(/\.$/, '')}<span style={{ color: '#e8341c' }}>.</span>
      </div>

      {/* Message */}
      <div style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: 14, color: 'rgba(245,245,240,0.6)',
        lineHeight: 1.5,
      }}>
        {win.message}
      </div>
    </div>
  );
}
