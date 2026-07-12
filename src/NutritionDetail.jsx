import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { getFoodIcon } from "./iconMap.js";

// Shared nutrition-detail sheet — works for a SINGLE logged food OR a whole MEAL (all entries in a
// slot). Pass `foods` = array of {food|name, calories, protein, carbs, fat}; totals are combined.
// Ring is split by calorie contribution (P×4 / C×4 / F×9); share-of-target bars use the combined
// total vs `dayTarget` (the same {calories,protein,carbs,fat} the calorie hero/macro bars use).
const RED = 'var(--cm-red,#FF3B30)', BLUE = '#60a5fa', AMBER = '#FEA020';

export default function NutritionDetail({ slotLabel, foods = [], dayTarget = {}, onClose, onFoodTap, hap }) {
  const list = (foods || []).filter(Boolean);
  const sum = k => list.reduce((s, f) => s + (Number(f?.[k]) || 0), 0);
  const cal = Math.round(sum('calories')), p = Math.round(sum('protein')), c = Math.round(sum('carbs')), fat = Math.round(sum('fat'));
  const pc = p * 4, cc = c * 4, fc = fat * 9, tot = (pc + cc + fc) || 1;

  const R = 46, SW = 13, CX = 62, CY = 62, CIRC = 2 * Math.PI * R;
  let cum = 0; // segments laid clockwise from 12 o'clock (group rotated -90)
  const arcs = [[RED, pc], [BLUE, cc], [AMBER, fc]].map(([col, val]) => {
    const len = (val / tot) * CIRC; const a = { col, dash: `${Math.max(0, len - 2)} ${CIRC}`, offset: -cum }; cum += len; return a;
  });
  const tgt = { cal: dayTarget.calories || 0, p: dayTarget.protein || 0, c: dayTarget.carbs || 0, f: dayTarget.fat || 0 };
  const macroRows = [['Protein', RED, p, tgt.p], ['Carbs', BLUE, c, tgt.c], ['Fat', AMBER, fat, tgt.f]];
  const isMeal = list.length > 1;
  const title = isMeal ? (slotLabel || 'Meal') : (list[0]?.food || list[0]?.name || 'Food');
  const eyebrow = isMeal ? `${list.length} foods · combined` : (slotLabel || 'Logged');

  const card = { background: 'var(--cm-paper,#FFFFFF)', borderRadius: 16, padding: '18px', marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,.10)' };
  const eb = { fontFamily: "'Archivo',sans-serif", fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' };

  return (
    <motion.div key="nutrition-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
      style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'var(--cm-red,#FF3B30)' }} onClick={() => { hap?.(); onClose?.(); }}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 290 }}
        style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: 'max(52px,env(safe-area-inset-top,48px)) 18px max(40px,env(safe-area-inset-bottom,28px))' }}>
          <button onClick={() => { hap?.(); onClose?.(); }} style={{ background: 'rgba(255,255,255,0.16)', border: 'none', borderRadius: 999, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', marginBottom: 20 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M10 4l-4 4 4 4" /></svg>
            <span style={{ ...eb, fontSize: 10, color: '#fff' }}>Close</span>
          </button>
          <div style={{ ...eb, fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>{eyebrow}</div>
          <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: '-0.01em', color: '#fff', lineHeight: 1.05, textTransform: 'capitalize', marginBottom: 18 }}>{title}</div>

          {/* Ring + nutrition label */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ flexShrink: 0, position: 'relative', width: 124, height: 124 }}>
              <svg width="124" height="124" viewBox="0 0 124 124">
                <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(var(--cm-ink-rgb,10,10,10),0.07)" strokeWidth={SW} />
                {arcs.map((a, i) => <circle key={i} cx={CX} cy={CY} r={R} fill="none" stroke={a.col} strokeWidth={SW} strokeLinecap="butt" strokeDasharray={a.dash} strokeDashoffset={a.offset} transform={`rotate(-90 ${CX} ${CY})`} />)}
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: '-0.01em', color: 'var(--cm-ink,#0A0A0A)', lineHeight: 1 }}>{cal}</div>
                <div style={{ ...eb, fontSize: 9, color: 'rgba(var(--cm-ink-rgb,10,10,10),0.4)', marginTop: 2 }}>kcal</div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...eb, fontSize: 10, color: 'rgba(var(--cm-ink-rgb,10,10,10),0.42)', paddingBottom: 7, marginBottom: 9, borderBottom: '2px solid rgba(var(--cm-ink-rgb,10,10,10),0.12)' }}>Nutrition</div>
              {macroRows.map(([label, col, val]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: col, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontFamily: "'Archivo',sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--cm-ink,#0A0A0A)' }}>{label}</span>
                  <span style={{ fontFamily: "'Archivo',sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--cm-ink,#0A0A0A)' }}>{val}g</span>
                </div>
              ))}
            </div>
          </div>

          {/* In this meal — per-food rows (combined view only) */}
          {isMeal && (
            <div style={card}>
              <div style={{ ...eb, fontSize: 10, color: 'rgba(var(--cm-ink-rgb,10,10,10),0.42)', marginBottom: 10 }}>In this meal</div>
              {list.map((f, i) => (
                <div key={i} onClick={onFoodTap ? () => { hap?.(); onFoodTap(f); } : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: i < list.length - 1 ? '1px solid rgba(var(--cm-ink-rgb,10,10,10),0.06)' : 'none', cursor: onFoodTap ? 'pointer' : 'default' }}>
                  <Icon icon={getFoodIcon(f.food || f.name || '')} width={26} height={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Archivo',sans-serif", fontWeight: 600, fontSize: 14, color: 'var(--cm-ink,#0A0A0A)', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.food || f.name || 'Item'}</div>
                    <div style={{ fontFamily: "'Archivo',sans-serif", fontSize: 11, fontWeight: 600, color: 'rgba(var(--cm-ink-rgb,10,10,10),0.45)', marginTop: 1 }}>{Math.round(f.protein || 0)}P · {Math.round(f.carbs || 0)}C · {Math.round(f.fat || 0)}F</div>
                  </div>
                  <div style={{ fontFamily: "'Archivo',sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--cm-red,#FF3B30)', flexShrink: 0 }}>{Math.round(f.calories || 0)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Share of today's target */}
          <div style={card}>
            <div style={{ ...eb, fontSize: 10, color: 'rgba(var(--cm-ink-rgb,10,10,10),0.42)', marginBottom: 14 }}>Share of today's target</div>
            {[['Calories', RED, cal, tgt.cal, 'kcal'], ...macroRows.map(r => [r[0], r[1], r[2], r[3], 'g'])].map(([label, col, val, target, unit]) => {
              const pctRaw = target > 0 ? (val / target) * 100 : 0; const pct = Math.round(pctRaw);
              return (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                    <span style={{ fontFamily: "'Archivo',sans-serif", fontSize: 12, fontWeight: 700, color: 'rgba(var(--cm-ink-rgb,10,10,10),0.6)', letterSpacing: '0.02em' }}>{label}</span>
                    <span style={{ fontFamily: "'Archivo',sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(var(--cm-ink-rgb,10,10,10),0.5)' }}>{val}{unit === 'g' ? 'g' : ''} / {target}{unit === 'g' ? 'g' : ' kcal'} · {pct}%</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 4, background: 'rgba(var(--cm-ink-rgb,10,10,10),0.08)', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, pctRaw))}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} style={{ height: '100%', borderRadius: 4, background: col }} />
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={() => { hap?.(); onClose?.(); }} style={{ width: '100%', background: '#fff', border: 'none', borderRadius: 14, padding: '15px', fontFamily: "'Archivo',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--cm-red,#FF3B30)', cursor: 'pointer' }}>Done</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
