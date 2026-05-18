import { useState, useEffect } from 'react';

function ComingSoonToast({ onDone }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2000);
    const t2 = setTimeout(onDone, 2300);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);
  return (
    <div style={{
      position: 'fixed', bottom: 100, left: '50%',
      transform: 'translateX(-50%)',
      background: '#111827',
      border: '1px solid rgba(232,52,28,0.3)',
      borderRadius: 8, padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 8,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
      zIndex: 9999,
      whiteSpace: 'nowrap',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e8341c', flexShrink: 0 }} />
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#f5f5f0' }}>
        Coming soon — stay tuned.
      </span>
    </div>
  );
}

function FeatureCard({ category, name, description, onTap }) {
  return (
    <button
      onClick={onTap}
      style={{
        background: '#111827',
        borderRadius: 12,
        padding: 14,
        border: '1px solid rgba(245,245,240,0.07)',
        minWidth: 160,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Red glow */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80,
        background: 'radial-gradient(circle, rgba(232,52,28,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Category eyebrow */}
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 8, color: '#e8341c',
        letterSpacing: '0.14em', textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        {category}
      </div>

      {/* Feature name */}
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontStyle: 'italic', fontWeight: 900,
        fontSize: 18, color: '#f5f5f0',
        lineHeight: 0.95, textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        {name}<span style={{ color: '#e8341c' }}>.</span>
      </div>

      {/* Description */}
      <div style={{
        fontFamily: "'Barlow', sans-serif",
        fontSize: 12, color: 'rgba(245,245,240,0.5)',
        lineHeight: 1.4,
        flex: 1,
        paddingBottom: 20,
      }}>
        {description}
      </div>

      {/* Arrow */}
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, color: '#e8341c',
        position: 'absolute', bottom: 12, right: 14,
      }}>
        →
      </div>
    </button>
  );
}

const TRAIN_CARDS = (onNavigate, onAdapt) => [
  {
    category: 'ADAPT AI',
    name: 'ADAPT NOW',
    description: 'Real-time session adjustments based on how you feel today.',
    action: () => onAdapt?.(),
  },
  {
    category: 'PROGRAMS',
    name: 'PROGRAM LIBRARY',
    description: '22 programs across lifting, running, Hyrox and hybrid.',
    action: () => onNavigate?.('plan'),
  },
  {
    category: 'DATABASE',
    name: 'EXERCISE LIBRARY',
    description: '79+ exercises with GIFs, muscle targeting and coaching notes.',
    action: () => onNavigate?.('library'),
  },
  {
    category: 'RECOVERY',
    name: 'MUSCLE MAP',
    description: 'Thermal body map showing exactly what needs rest and what is ready.',
    action: null,
  },
  {
    category: 'COACHING',
    name: 'WARM-UP SYSTEM',
    description: 'Contextual warm-ups before every session based on what you are training today.',
    action: 'info',
  },
  {
    category: 'INTELLIGENCE',
    name: 'TRAINING DNA',
    description: 'Your unique athletic identity calculated from real training data.',
    action: null,
  },
];

const FUEL_CARDS = (onNavigate, onPhoto, onBarcode) => [
  {
    category: 'AI NUTRITION',
    name: 'RESTAURANT AI',
    description: 'Scan any menu and get macro-optimised meal recommendations instantly.',
    action: () => onNavigate?.('recs'),
  },
  {
    category: 'AI LOGGING',
    name: 'SNAP & LOG',
    description: 'Photograph your meal and AI logs the macros automatically.',
    action: () => onPhoto?.(),
  },
  {
    category: 'INTELLIGENCE',
    name: 'MACRO MEMORY',
    description: 'Learns your food preferences and suggests meals you actually enjoy.',
    action: null,
  },
  {
    category: 'DAILY BRIEF',
    name: 'MORNING BRIEF',
    description: 'AI coach message every morning based on your training and nutrition data.',
    action: null,
  },
  {
    category: 'TRACKING',
    name: 'BARCODE SCAN',
    description: 'Instant macro data for any packaged food. 3 million products.',
    action: () => onBarcode?.(),
  },
  {
    category: 'PLANNING',
    name: 'MEAL PLANNER',
    description: 'Weekly meal plans built around your macro targets and training schedule.',
    action: null,
  },
];

const PROGRESS_CARDS = (onProgressTab) => [
  {
    category: 'ANALYTICS',
    name: 'COACH MACRO SCORE',
    description: 'One number that combines training, nutrition, recovery and consistency.',
    action: () => onProgressTab?.('overview'),
  },
  {
    category: 'STRENGTH',
    name: 'PERSONAL RECORDS',
    description: 'Every PR tracked automatically across all exercises.',
    action: () => onProgressTab?.('strength'),
  },
  {
    category: 'IDENTITY',
    name: 'TRAINING DNA',
    description: 'See your dominant athletic dimension and the title you have earned.',
    action: () => onProgressTab?.('overview'),
  },
  {
    category: 'NUTRITION',
    name: 'WEIGHT PROJECTION',
    description: 'See exactly when you will reach your goal weight at your current rate.',
    action: () => onProgressTab?.('nutrition'),
  },
  {
    category: 'RECOVERY',
    name: 'THERMAL BODY MAP',
    description: 'Infrared heat map of your recovery state across all muscle groups.',
    action: () => onProgressTab?.('recovery'),
  },
  {
    category: 'CALENDAR',
    name: 'PERFORMANCE CALENDAR',
    description: 'Every training and nutrition day visualised in one month view.',
    action: () => onProgressTab?.('overview'),
  },
];

export default function FeatureStrip({ tab, onNavigate, onAdapt, onPhoto, onBarcode, onProgressTab }) {
  const [showToast, setShowToast] = useState(false);

  const cards =
    tab === 'train' ? TRAIN_CARDS(onNavigate, onAdapt) :
    tab === 'fuel'  ? FUEL_CARDS(onNavigate, onPhoto, onBarcode) :
    tab === 'progress' ? PROGRESS_CARDS(onProgressTab) :
    [];

  function handleTap(action) {
    if (action === null || action === undefined) {
      setShowToast(true);
    } else if (action === 'info') {
      // informational — no action
    } else {
      action();
    }
  }

  return (
    <>
      {showToast && <ComingSoonToast onDone={() => setShowToast(false)} />}
      <div>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9, color: '#e8341c',
          letterSpacing: '0.16em', textTransform: 'uppercase',
          marginBottom: 10,
        }}>
          // POWERED BY COACH MACRO
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          gap: 10,
          paddingBottom: 4,
        }}>
          {cards.map((card) => (
            <FeatureCard
              key={card.name}
              category={card.category}
              name={card.name}
              description={card.description}
              onTap={() => handleTap(card.action)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
