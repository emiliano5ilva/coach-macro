import React, { useState } from 'react';

export default function CollapsibleAlert({ color, summary, children, margin, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (expanded) {
    return (
      <div style={{ margin: margin || '0 20px 8px' }}>
        {children}
        <div onClick={() => setExpanded(false)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '8px 0', cursor: 'pointer',
          fontFamily: 'DM Mono, monospace', fontSize: 8,
          color: 'rgba(245,245,240,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          ↑ COLLAPSE
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => setExpanded(true)} style={{
      margin: margin || '0 20px 6px',
      background: 'rgba(245,245,240,0.02)',
      border: '1px solid rgba(245,245,240,0.06)',
      borderRadius: 10,
      padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
      cursor: 'pointer',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: '#f5f5f0', flex: 1, letterSpacing: '0.06em', lineHeight: 1.4 }}>
        {summary}
      </div>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'rgba(245,245,240,0.3)', flexShrink: 0 }}>↓</div>
    </div>
  );
}
