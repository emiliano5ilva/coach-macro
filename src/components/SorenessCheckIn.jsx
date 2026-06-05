import { useState } from 'react';
import { logSoreness } from '../services/sorenessService';

const MUSCLES = ['Quads','Hamstrings','Glutes','Calves','Chest','Back','Shoulders','Arms','Core'];

const mono = { fontFamily:"'DM Mono','SF Mono',monospace" };
const cond = { fontFamily:"'Barlow Condensed',sans-serif" };

function scoreColor(s) {
  if (!s) return null;
  if (s <= 3) return { bg:'rgba(34,197,94,0.2)', border:'#22c55e', text:'#22c55e' };
  if (s <= 6) return { bg:'rgba(254,160,32,0.2)', border:'#FEA020', text:'#FEA020' };
  return { bg:'rgba(232,52,28,0.2)', border:'#e8341c', text:'#e8341c' };
}

// Palette for dark (default) and light (white-card) contexts.
// light=true → white-card GoClub home; light=false → dark TrainSection card.
function palette(light) {
  if (light) return {
    heading:        '#111111',
    circleNum:      'rgba(17,17,17,0.45)',
    circleBg:       'rgba(17,17,17,0.05)',
    circleBorder:   'rgba(17,17,17,0.12)',
    freshDestroyed: 'rgba(17,17,17,0.40)',
    whereLabel:     'rgba(17,17,17,0.55)',
    chipText:       'rgba(17,17,17,0.45)',
    chipBorder:     'rgba(17,17,17,0.12)',
    chipBg:         'rgba(17,17,17,0.04)',
    divider:        'rgba(232,52,28,0.12)',
    skipText:       'rgba(17,17,17,0.38)',
    skipBorder:     'rgba(17,17,17,0.12)',
  };
  return {
    heading:        '#f5f5f0',
    circleNum:      'rgba(245,245,240,0.4)',
    circleBg:       'rgba(245,245,240,0.06)',
    circleBorder:   'rgba(245,245,240,0.1)',
    freshDestroyed: 'rgba(245,245,240,0.3)',
    whereLabel:     'rgba(245,245,240,0.5)',
    chipText:       'rgba(245,245,240,0.4)',
    chipBorder:     'rgba(245,245,240,0.1)',
    chipBg:         'rgba(245,245,240,0.05)',
    divider:        'rgba(232,52,28,0.12)',
    skipText:       'rgba(245,245,240,0.4)',
    skipBorder:     'rgba(245,245,240,0.1)',
  };
}

export function SorenesSummary({ score, muscles, light = false }) {
  const pal = palette(light);
  const c = scoreColor(score) || { bg:'rgba(245,245,240,0.06)', border:'rgba(245,245,240,0.1)', text:'rgba(245,245,240,0.5)' };
  return (
    <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${pal.divider}`,display:'flex',alignItems:'center',gap:10}}>
      <div style={{width:32,height:32,borderRadius:'50%',background:c.bg,border:`1px solid ${c.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <span style={{...cond,fontStyle:'italic',fontWeight:900,fontSize:14,color:c.text}}>{score}</span>
      </div>
      <div>
        <div style={{...mono,fontSize:9,color:pal.heading,letterSpacing:'0.08em'}}>Soreness logged</div>
        {muscles?.length > 0 && (
          <div style={{...mono,fontSize:9,color:pal.whereLabel,marginTop:2}}>{muscles.join(', ')}</div>
        )}
      </div>
    </div>
  );
}

export default function SorenessCheckIn({ userId, onComplete, onSkip, light = false }) {
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const pal = palette(light);

  const c = scoreColor(score);
  const showMuscles = score >= 4;

  function toggleMuscle(m) {
    setSelected(s => s.includes(m) ? s.filter(x => x !== m) : [...s, m]);
  }

  async function confirm() {
    if (!score) return;
    setSaving(true);
    try { await logSoreness(userId, score, selected); } catch (e) { console.error('[soreness] save error', e); }
    onComplete(score, selected);
  }

  return (
    <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${pal.divider}`}}>
      <div style={{...mono,fontSize:9,color:'#e8341c',letterSpacing:'0.16em',textTransform:'uppercase',marginBottom:8}}>// HOW ARE YOU FEELING?</div>
      <div style={{...cond,fontStyle:'italic',fontWeight:900,fontSize:18,color:pal.heading,lineHeight:0.95,marginBottom:14}}>Rate your soreness today.</div>

      {/* Score circles */}
      <div style={{display:'flex',gap:6,marginBottom:6}}>
        {Array.from({length:10},(_,i)=>i+1).map(n=>{
          const col = score===n ? scoreColor(n) : null;
          return (
            <div key={n} onClick={()=>setScore(n)} style={{
              width:28,height:28,borderRadius:'50%',cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',
              ...mono,fontSize:9,fontWeight:700,
              background: col ? col.bg : pal.circleBg,
              border: `1px solid ${col ? col.border : pal.circleBorder}`,
              color: col ? col.text : pal.circleNum,
              transition:'all 0.15s',
              flexShrink:0,
            }}>{n}</div>
          );
        })}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',...mono,fontSize:7,color:pal.freshDestroyed,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:showMuscles?0:14}}>
        <span>FRESH</span><span>DESTROYED</span>
      </div>

      {/* Muscle chips — slide in when score >= 4 */}
      <div style={{
        overflow:'hidden',
        maxHeight: showMuscles ? 120 : 0,
        opacity: showMuscles ? 1 : 0,
        transition:'max-height 0.25s ease, opacity 0.2s ease',
        marginTop: showMuscles ? 12 : 0,
      }}>
        <div style={{...mono,fontSize:9,color:pal.whereLabel,marginBottom:8,letterSpacing:'0.08em',textTransform:'uppercase'}}>Where are you sore?</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14}}>
          {MUSCLES.map(m=>{
            const on = selected.includes(m);
            return (
              <div key={m} onClick={()=>toggleMuscle(m)} style={{
                borderRadius:20,padding:'5px 12px',cursor:'pointer',
                ...mono,fontSize:9,textTransform:'uppercase',letterSpacing:'0.08em',
                background: on ? 'rgba(232,52,28,0.15)' : pal.chipBg,
                border: `1px solid ${on ? 'rgba(232,52,28,0.4)' : pal.chipBorder}`,
                color: on ? '#e8341c' : pal.chipText,
                transition:'all 0.15s',
              }}>{m}</div>
            );
          })}
        </div>
      </div>

      {/* Buttons */}
      {score > 0 && (
        <div style={{display:'flex',gap:8}}>
          <button onClick={confirm} disabled={saving} style={{
            flex:1,background:'#e8341c',border:'none',borderRadius:10,padding:11,
            ...mono,fontWeight:700,fontSize:9,color:'#fff',letterSpacing:'0.14em',
            textTransform:'uppercase',cursor:'pointer',opacity:saving?0.6:1,
          }}>CONFIRM →</button>
          <button onClick={onSkip} style={{
            flex:1,background:'transparent',border:`1px solid ${pal.skipBorder}`,
            borderRadius:10,padding:11,
            ...mono,fontSize:9,color:pal.skipText,letterSpacing:'0.14em',
            textTransform:'uppercase',cursor:'pointer',
          }}>SKIP</button>
        </div>
      )}
    </div>
  );
}
