import React, { useState, useEffect } from 'react';

export default function SpotlightTour({ steps, onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const step = steps[currentStep];

  useEffect(() => {
    if (!step?.targetSelector) { setTargetRect(null); return; }
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setTargetRect(null);
    }
  }, [currentStep, step]);

  function handleNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      onComplete();
    }
  }

  const padding = 12;
  const r = targetRect;

  // Position tooltip below target if target is in top half, above if in bottom half
  const tooltipBelow = r ? r.top <= window.innerHeight / 2 : false;
  const tooltipStyle = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 40px)',
    maxWidth: 360,
    background: '#0d0d0d',
    border: '1px solid rgba(232,52,28,0.25)',
    borderRadius: 14,
    padding: 16,
    zIndex: 10000,
    ...(r && tooltipBelow
      ? { top: r.bottom + 16 }
      : r
        ? { bottom: window.innerHeight - r.top + 16 }
        : { top: '50%', marginTop: -100 }),
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'all' }}>
      {/* Dark overlay with spotlight cutout */}
      {r ? (
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'all' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={r.left - padding}
                y={r.top - padding}
                width={r.width + padding * 2}
                height={r.height + padding * 2}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.85)" mask="url(#spotlight-mask)" />
          {/* Red border ring */}
          <rect
            x={r.left - padding}
            y={r.top - padding}
            width={r.width + padding * 2}
            height={r.height + padding * 2}
            rx="12"
            fill="none"
            stroke="rgba(232,52,28,0.6)"
            strokeWidth="1.5"
          />
        </svg>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', pointerEvents: 'all' }} />
      )}

      {/* Uniform dim layer — dims spotlight hole so background buttons look inactive */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1, pointerEvents: 'none' }} />

      {/* Tooltip card */}
      <div style={tooltipStyle}>
        {/* Step counter + skip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 8, color: '#e8341c', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            {currentStep + 1} OF {steps.length}
          </div>
          <button
            onClick={onSkip}
            style={{ background: 'none', border: 'none', fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'rgba(245,245,240,0.3)', cursor: 'pointer', padding: '2px 6px' }}
          >
            SKIP TOUR
          </button>
        </div>

        {/* Headline */}
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontStyle: 'italic', fontWeight: 900, fontSize: 20, color: '#f5f5f0', lineHeight: 1, marginBottom: 6, textTransform: 'uppercase' }}>
          {step.headline}<span style={{ color: '#e8341c' }}>.</span>
        </div>

        {/* Description */}
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, color: 'rgba(245,245,240,0.6)', lineHeight: 1.5, marginBottom: 14 }}>
          {step.description}
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 12 }}>
          {steps.map((_, i) => (
            <div key={i} style={{ width: i === currentStep ? 16 : 6, height: 6, borderRadius: 3, background: i === currentStep ? '#e8341c' : 'rgba(245,245,240,0.15)', transition: 'all 0.3s ease' }} />
          ))}
        </div>

        {/* Next / Let's Go button */}
        <button
          onClick={handleNext}
          style={{ width: '100%', background: '#e8341c', border: 'none', borderRadius: 10, padding: '12px 0', fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 11, color: '#fff', letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          {currentStep < steps.length - 1 ? 'NEXT →' : "LET'S GO →"}
        </button>
      </div>
    </div>
  );
}
