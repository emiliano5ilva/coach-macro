import React, { useEffect, useState } from 'react';

export default function WinScreen({ win, onContinue }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (!win) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 28px',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease',
    }}>
      {/* Red radial glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232,52,28,0.18) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Emoji */}
      <div style={{
        fontSize: 72, marginBottom: 28,
        animation: 'winBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
        animationDelay: '0.2s',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease 0.2s',
      }}>
        {win.emoji}
      </div>

      {/* Headline */}
      <div style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontStyle: 'italic',
        fontWeight: 900,
        fontSize: 40,
        color: '#f5f5f0',
        textTransform: 'uppercase',
        lineHeight: 1,
        textAlign: 'center',
        marginBottom: 16,
      }}>
        {win.headline.replace(/\.$/, '')}<span style={{ color: '#e8341c' }}>.</span>
      </div>

      {/* Message */}
      <div style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: 17,
        color: 'rgba(245,245,240,0.6)',
        lineHeight: 1.55,
        textAlign: 'center',
        marginBottom: 48,
        maxWidth: 300,
      }}>
        {win.message}
      </div>

      {/* CTA */}
      <button
        onClick={onContinue}
        style={{
          width: '100%', maxWidth: 320,
          background: '#e8341c',
          border: 'none',
          borderRadius: 14,
          padding: '16px 0',
          fontFamily: 'DM Mono, monospace',
          fontWeight: 700,
          fontSize: 12,
          color: '#fff',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        {win.cta}
      </button>

      <style>{`
        @keyframes winBounce {
          0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
