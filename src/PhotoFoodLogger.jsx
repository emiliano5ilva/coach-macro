import React, { useState, useRef, useEffect } from "react";
import { T } from "./components.jsx";
import { sb } from "./client.js";
import { showToast } from "./utils/toast.js";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// ── Helpers ──────────────────────────────────────────────────────────────────

function resizeImageBase64(base64, maxPx = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]);
    };
    img.src = "data:image/jpeg;base64," + base64;
  });
}

async function uploadPhoto(userId, base64) {
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const path = `${userId}/${Date.now()}.jpg`;
    const { error } = await sb.storage.from("food-photos").upload(path, bytes, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (error) return null;
    const { data } = sb.storage.from("food-photos").getPublicUrl(path);
    return data?.publicUrl || null;
  } catch {
    return null;
  }
}

// ── Tutorial ─────────────────────────────────────────────────────────────────

const TUTORIAL_ILLUS = [
  // Step 1 — Point & Shoot
  <svg width={96} height={96} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x={12} y={26} width={72} height={52} rx={10} fill="rgba(232,52,28,0.12)" stroke="rgba(232,52,28,0.5)" strokeWidth={2}/>
    <rect x={36} y={14} width={24} height={14} rx={5} fill="rgba(232,52,28,0.2)" stroke="rgba(232,52,28,0.4)" strokeWidth={1.5}/>
    <circle cx={48} cy={54} r={14} fill="none" stroke="rgba(232,52,28,0.6)" strokeWidth={2}/>
    <circle cx={48} cy={54} r={8} fill="rgba(232,52,28,0.25)"/>
    <circle cx={64} cy={36} r={4} fill="rgba(232,52,28,0.5)"/>
  </svg>,
  // Step 2 — AI Identifies Foods
  <svg width={96} height={96} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx={48} cy={42} r={22} fill="rgba(232,52,28,0.1)" stroke="rgba(232,52,28,0.45)" strokeWidth={2}/>
    <path d="M40 38 L44 46 L52 34 L56 42 L60 38" stroke="rgba(232,52,28,0.8)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
    <line x1={30} y1={68} x2={66} y2={68} stroke="rgba(232,52,28,0.3)" strokeWidth={1.5} strokeDasharray="4 3"/>
    <rect x={28} y={72} width={16} height={6} rx={3} fill="rgba(232,52,28,0.2)"/>
    <rect x={50} y={72} width={18} height={6} rx={3} fill="rgba(232,52,28,0.15)"/>
  </svg>,
  // Step 3 — Add Notes
  <svg width={96} height={96} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x={18} y={20} width={52} height={62} rx={8} fill="rgba(232,52,28,0.08)" stroke="rgba(232,52,28,0.35)" strokeWidth={2}/>
    <line x1={28} y1={38} x2={60} y2={38} stroke="rgba(232,52,28,0.5)" strokeWidth={2} strokeLinecap="round"/>
    <line x1={28} y1={50} x2={56} y2={50} stroke="rgba(232,52,28,0.35)" strokeWidth={1.5} strokeLinecap="round"/>
    <line x1={28} y1={62} x2={46} y2={62} stroke="rgba(232,52,28,0.25)" strokeWidth={1.5} strokeLinecap="round"/>
    <circle cx={74} cy={26} r={12} fill="rgba(232,52,28,0.9)"/>
    <path d="M70 26 L73 29 L78 23" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
  // Step 4 — Review & Edit
  <svg width={96} height={96} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x={14} y={24} width={68} height={50} rx={10} fill="rgba(232,52,28,0.08)" stroke="rgba(232,52,28,0.3)" strokeWidth={2}/>
    <circle cx={48} cy={49} r={16} fill="rgba(232,52,28,0.15)" stroke="rgba(232,52,28,0.5)" strokeWidth={2}/>
    <path d="M41 49 L46 54 L56 44" stroke="rgba(232,52,28,0.9)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>,
];

const TUTORIAL_STEPS = [
  {
    illus: TUTORIAL_ILLUS[0],
    title: "Point & Shoot",
    body: "Take a photo of your full plate. Include everything you plan to eat.",
  },
  {
    illus: TUTORIAL_ILLUS[1],
    title: "AI Identifies Foods",
    body: "Claude scans your meal and breaks it into individual ingredients with estimated macros.",
  },
  {
    illus: TUTORIAL_ILLUS[2],
    title: "Add Notes for Accuracy",
    body: 'Tap "Photo + Notes" to describe your meal — cooking method, brand, or portion size — for more precise results.',
  },
  {
    illus: TUTORIAL_ILLUS[3],
    title: "Review & Edit",
    body: "Adjust portions, fix names, or add missing items. Then tap Log to add everything at once.",
  },
];

function Tutorial({ onDone }) {
  const [step, setStep] = useState(0);
  const s = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,13,26,.96)", zIndex: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ maxWidth: 340, width: "100%", textAlign: "center" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", marginBottom: 24 }}>{s.illus}</div>
        <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 12 }}>{s.title}</div>
        <div style={{ fontSize: 14, color: T.mu, lineHeight: 1.6, marginBottom: 40 }}>{s.body}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 32 }}>
          {TUTORIAL_STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 3, background: i === step ? T.brand : T.bd, transition: "all .2s" }} />
          ))}
        </div>
        <button
          onClick={() => { if (isLast) { localStorage.setItem("cm_photo_tutorial", "1"); onDone(); } else setStep(step + 1); }}
          style={{ width: "100%", padding: "15px", borderRadius: 14, background: T.brand, border: "none", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.08em" }}
        >
          {isLast ? "GET STARTED" : "NEXT"}
        </button>
        {step === 0 && (
          <button onClick={() => { localStorage.setItem("cm_photo_tutorial", "1"); onDone(); }} style={{ marginTop: 14, background: "none", border: "none", color: T.mu, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            Skip tutorial
          </button>
        )}
      </div>
    </div>
  );
}

// ── Camera Screen ─────────────────────────────────────────────────────────────

const CAMERA_TIPS = [
  'Include a fork in frame for better accuracy',
  'A hand next to food helps portion estimates',
  'Top-down shots work best',
  'Good lighting = better results',
];

function CameraScreen({ onCapture, onClose, onFallback, photoMode, setPhotoMode }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [torch, setTorch] = useState(false);
  const [permDenied, setPermDenied] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTipIdx(i => (i + 1) % CAMERA_TIPS.length), 4000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    let active = true;
    async function start() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
        });
        if (!active) { s.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      } catch (e) {
        if (!active) return;
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          setPermDenied(true);
        } else {
          onFallback();
        }
      }
    }
    start();
    return () => { active = false; streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    onCapture(dataUrl.split(",")[1], dataUrl);
  }

  function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const newVal = !torch;
    track.applyConstraints({ advanced: [{ torch: newVal }] }).catch(() => {});
    setTorch(newVal);
  }

  if (permDenied) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        <div style={{ marginBottom: 20 }}><svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="rgba(245,245,240,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="14" width="36" height="26" rx="4"/><circle cx="24" cy="27" r="7"/><path d="M17 14l2-4h10l2 4"/></svg></div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Camera Access Needed</div>
        <div style={{ fontSize: 13, color: T.mu, marginBottom: 32, lineHeight: 1.6 }}>
          Allow camera access in your device settings to use photo logging.
        </div>
        <button onClick={onFallback} style={{ width: "100%", maxWidth: 280, padding: "14px", borderRadius: 12, background: T.brand, border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>
          Choose from Library Instead
        </button>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.mu, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 500 }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />

      {ready && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {[["top:15%,left:10%","top right"],["top:15%,right:10%","top left"],["bottom:20%,left:10%","bottom right"],["bottom:20%,right:10%","bottom left"]].map(([pos, corners], idx) => {
            const style = Object.fromEntries(pos.split(",").map(p => p.split(":")));
            return (
              <div key={idx} style={{ position: "absolute", width: 40, height: 40, ...style }}>
                <svg width="40" height="40" viewBox="0 0 40 40">
                  {corners.includes("top") && corners.includes("left") && <path d="M2 14 L2 2 L14 2" stroke="rgba(255,255,255,.7)" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
                  {corners.includes("top") && corners.includes("right") && <path d="M26 2 L38 2 L38 14" stroke="rgba(255,255,255,.7)" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
                  {corners.includes("bottom") && corners.includes("left") && <path d="M2 26 L2 38 L14 38" stroke="rgba(255,255,255,.7)" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
                  {corners.includes("bottom") && corners.includes("right") && <path d="M26 38 L38 38 L38 26" stroke="rgba(255,255,255,.7)" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
                </svg>
              </div>
            );
          })}
          <div style={{ position: "absolute", top: "12%", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.4)", borderRadius: 20, padding: "6px 16px", fontSize: 12, color: "rgba(255,255,255,.75)", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
            Frame your full plate
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "52px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(to bottom,rgba(0,0,0,.6),transparent)" }}>
        <button onClick={onClose} style={{ background: "rgba(0,0,0,.4)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 20, padding: "8px 16px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
        <button onClick={toggleTorch} style={{ background: torch ? "rgba(255,200,0,.3)" : "rgba(0,0,0,.4)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 20, padding: "8px 16px", color: torch ? "#FFD700" : "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          {torch ? "On" : "Flash"}
        </button>
      </div>

      {/* Mode toggle pill */}
      <div style={{ position: "absolute", top: "calc(52px + 44px + 16px)", left: "50%", transform: "translateX(-50%)", display: "flex", background: "rgba(0,0,0,.55)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 24, padding: 3, gap: 2 }}>
        {[["photo", "Photo Only"], ["photo+text", "Photo + Notes"]].map(([mode, label]) => (
          <button key={mode} onClick={() => setPhotoMode(mode)} style={{ padding: "6px 14px", borderRadius: 20, border: "none", background: photoMode === mode ? "rgba(255,255,255,.2)" : "none", color: photoMode === mode ? "#fff" : "rgba(255,255,255,.5)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Bottom capture controls */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top,rgba(0,0,0,.8),transparent)" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 40, padding: "20px 32px 16px" }}>
          <button onClick={onFallback} style={{ background: "rgba(255,255,255,.15)", border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 12, padding: "10px 16px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "center", lineHeight: 1.3 }}>
Library
          </button>
          <button
            onClick={capture}
            disabled={!ready}
            style={{ width: 72, height: 72, borderRadius: "50%", background: ready ? T.brand : T.bd, border: "4px solid rgba(255,255,255,.6)", cursor: ready ? "pointer" : "default", flexShrink: 0, transition: "all .15s", transform: ready ? "scale(1)" : "scale(.9)" }}
          />
          <div style={{ width: 56 }} />
        </div>
        <div style={{ textAlign: "center", padding: "0 24px 48px", minHeight: 36 }}>
          <div key={tipIdx} style={{ fontSize: 11, color: "rgba(255,255,255,.6)", animation: "fadeIn .4s ease" }}>
            {CAMERA_TIPS[tipIdx]}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── File Picker (fallback) ────────────────────────────────────────────────────

function FilePicker({ onCapture, onClose }) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.click();
  }, []);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) { onClose(); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      onCapture(dataUrl.split(",")[1], dataUrl);
    };
    reader.readAsDataURL(file);
  }

  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      capture="environment"
      onChange={handleFile}
      onCancel={onClose}
      style={{ display: "none" }}
    />
  );
}

// ── Notes Screen ──────────────────────────────────────────────────────────────

function NotesScreen({ previewDataUrl, onAnalyze, onSkip, onCancel }) {
  const [text, setText] = useState("");

  return (
    <div style={{ position: "fixed", inset: 0, background: T.bg, zIndex: 500, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "52px 20px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        {previewDataUrl && (
          <img src={previewDataUrl} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", border: `1.5px solid ${T.bd}`, flexShrink: 0 }} />
        )}
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Barlow Condensed',sans-serif" }}>DESCRIBE YOUR MEAL</div>
          <div style={{ fontSize: 12, color: T.mu, marginTop: 2 }}>Help the AI be more accurate</div>
        </div>
      </div>

      <div style={{ padding: "0 20px", flex: 1 }}>
        <textarea
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={`Examples:\n• "Chicken breast grilled in olive oil, about 6oz"\n• "McDonald's Big Mac and medium fries"\n• "Homemade protein smoothie with 2 scoops whey, banana, almond milk"`}
          style={{ width: "100%", minHeight: 180, background: T.s1, border: `1px solid ${T.bd}`, borderRadius: 14, padding: "14px", color: "#fff", fontSize: 13, lineHeight: 1.6, fontFamily: "inherit", resize: "none", boxSizing: "border-box" }}
        />
        <div style={{ fontSize: 11, color: T.mu, marginTop: 8 }}>
          Mention brand names, cooking methods, portion sizes, or anything the photo might miss.
        </div>
      </div>

      <div style={{ padding: "16px 20px 48px", display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={() => onAnalyze(text.trim())}
          style={{ width: "100%", padding: "16px", borderRadius: 14, background: T.brand, border: "none", color: "#fff", fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.08em" }}
        >
          ANALYZE WITH NOTES
        </button>
        <button
          onClick={onSkip}
          style={{ width: "100%", padding: "13px", borderRadius: 14, background: "none", border: `1.5px solid ${T.bd}`, color: T.mu, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >
          Skip notes, analyze photo only
        </button>
        <button onClick={onCancel} style={{ background: "none", border: "none", color: T.mu, fontSize: 12, cursor: "pointer", fontFamily: "inherit", paddingTop: 4 }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Analyzing Screen ──────────────────────────────────────────────────────────

function AnalyzingScreen({ previewDataUrl, onCancel }) {
  const [dots, setDots] = useState(".");
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const start = Date.now();
    const total = 10000;
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      setPct(Math.min(90, Math.round((elapsed / total) * 90)));
    }, 100);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,13,26,.97)", zIndex: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      {previewDataUrl && (
        <div style={{ width: 140, height: 140, borderRadius: 20, overflow: "hidden", marginBottom: 28, border: `2px solid ${T.bd}`, position: "relative" }}>
          <img src={previewDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(6,13,26,.35)" }} />
        </div>
      )}
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Analyzing your meal{dots}</div>
      <div style={{ fontSize: 13, color: T.mu, marginBottom: 28 }}>Breaking down ingredients and verifying macros</div>
      <div style={{ width: "100%", maxWidth: 280, height: 4, background: T.s2, borderRadius: 2, overflow: "hidden", marginBottom: 28 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: T.brand, borderRadius: 2, transition: "width .1s linear" }} />
      </div>
      <button onClick={onCancel} style={{ background: "none", border: "none", color: T.mu, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
    </div>
  );
}

// ── Confirmation Screen ───────────────────────────────────────────────────────

const SCALE_OPTS = [0.5, 1, 1.5, 2];
const SCALE_LABELS = { 0.5: "½×", 1: "1×", 1.5: "1½×", 2: "2×" };

function ConfirmScreen({ analysis, previewDataUrl, onLog, onRetake, onClose }) {
  const [items, setItems] = useState(() =>
    (analysis.items || []).map(item => ({
      ...item,
      aiName: item.name,
      scale: 1,
      _removed: false,
    }))
  );
  const [editingIdx, setEditingIdx] = useState(null);
  const [editName, setEditName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", portion: "", calories: "", protein: "", carbs: "", fat: "" });

  // item.calories/protein/etc. are always the original 1x values — just multiply by scale
  function scaledValues(item, scale) {
    return {
      calories: Math.round(item.calories * scale),
      protein:  Math.round(item.protein  * scale * 10) / 10,
      carbs:    Math.round(item.carbs    * scale * 10) / 10,
      fat:      Math.round(item.fat      * scale * 10) / 10,
    };
  }

  const activeItems = items.filter(i => !i._removed);

  const totals = activeItems.reduce((acc, item) => {
    const v = scaledValues(item, item.scale);
    return {
      calories: acc.calories + v.calories,
      protein:  acc.protein  + v.protein,
      carbs:    acc.carbs    + v.carbs,
      fat:      acc.fat      + v.fat,
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  function setScale(idx, scale) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, scale } : item));
  }

  function removeItem(idx) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, _removed: true } : item));
  }

  function undoRemove(idx) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, _removed: false } : item));
  }

  function startEditName(idx, currentName) {
    setEditingIdx(idx);
    setEditName(currentName);
  }

  function commitEditName(idx) {
    if (editName.trim()) {
      setItems(prev => prev.map((item, i) => i === idx ? { ...item, name: editName.trim() } : item));
    }
    setEditingIdx(null);
  }

  function addIngredient() {
    const f = addForm;
    if (!f.name.trim() || !f.calories) return;
    const newItem = {
      name: f.name.trim(),
      aiName: f.name.trim(),
      portion: f.portion || "1 serving",
      calories: parseInt(f.calories) || 0,
      protein:  parseFloat(f.protein)  || 0,
      carbs:    parseFloat(f.carbs)    || 0,
      fat:      parseFloat(f.fat)      || 0,
      source: "manual",
      verified: false,
      scale: 1,
      _removed: false,
    };
    setItems(prev => [...prev, newItem]);
    setAddForm({ name: "", portion: "", calories: "", protein: "", carbs: "", fat: "" });
    setShowAdd(false);
  }

  function handleLog() {
    const corrections = items
      .filter(item => !item._removed && (item.name !== item.aiName || item.scale !== 1))
      .map(item => ({
        ai_identified: item.aiName,
        user_corrected_to: item.name !== item.aiName ? item.name : null,
        portion_adjustment: item.scale !== 1 ? item.scale : null,
      }));

    const loggableItems = activeItems.map(item => {
      const v = scaledValues(item, item.scale);
      return {
        id: Date.now() + Math.random(),
        food: item.name,
        calories: v.calories,
        protein:  v.protein,
        carbs:    v.carbs,
        fat:      v.fat,
        method: "photo",
        portion: item.portion,
      };
    });

    onLog(loggableItems, totals, corrections);
  }

  const confidenceColor = { high: "#4ade80", medium: "#fbbf24", low: T.mu }[analysis.confidence] || T.mu;

  return (
    <div style={{ position: "fixed", inset: 0, background: T.bg, zIndex: 500, overflowY: "auto" }}>
      {/* Header */}
      <div style={{ padding: "52px 20px 0", display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "'Barlow Condensed',sans-serif", lineHeight: 1.1 }}>HERE'S WHAT I SEE</div>
          {analysis.confidence && (
            <div style={{ fontSize: 11, color: confidenceColor, fontWeight: 700, marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: confidenceColor }} />
              {analysis.confidence.toUpperCase()} CONFIDENCE
            </div>
          )}
        </div>
        {previewDataUrl && (
          <img src={previewDataUrl} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: `1.5px solid ${T.bd}`, flexShrink: 0 }} />
        )}
      </div>

      <div style={{ padding: "0 20px 12px" }}>
        {/* Items list */}
        {items.map((item, i) => {
          if (item._removed) return (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", opacity: 0.4 }}>
              <div style={{ fontSize: 13, textDecoration: "line-through", color: T.mu }}>{item.name}</div>
              <button onClick={() => undoRemove(i)} style={{ background: "none", border: "none", color: T.brand, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Undo</button>
            </div>
          );

          const v = scaledValues(item, item.scale);
          const isEditing = editingIdx === i;

          return (
            <div key={i} style={{ background: T.s1, border: `1px solid ${T.bd}`, borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ flex: 1, marginRight: 8 }}>
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onBlur={() => commitEditName(i)}
                      onKeyDown={e => { if (e.key === "Enter") commitEditName(i); if (e.key === "Escape") setEditingIdx(null); }}
                      style={{ width: "100%", background: T.s2, border: `1px solid ${T.brand}`, borderRadius: 8, padding: "4px 8px", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit", boxSizing: "border-box" }}
                    />
                  ) : (
                    <button onClick={() => startEditName(i, item.name)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", width: "100%" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{item.name}</div>
                    </button>
                  )}
                  <div style={{ fontSize: 11, color: T.mu, marginTop: 1 }}>{item.portion}</div>

                  {/* Source badge */}
                  <div style={{ marginTop: 4 }}>
                    {item.source === "usda" ? (
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#4ade80", background: "rgba(74,222,128,.12)", border: "1px solid rgba(74,222,128,.25)", borderRadius: 4, padding: "1px 6px", letterSpacing: "0.06em" }}>✓ DATABASE VERIFIED</span>
                    ) : item.source === "manual" ? (
                      <span style={{ fontSize: 9, fontWeight: 700, color: T.mu, background: T.s2, borderRadius: 4, padding: "1px 6px", letterSpacing: "0.06em" }}>MANUAL ENTRY</span>
                    ) : (
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#fbbf24", background: "rgba(251,191,36,.1)", border: "1px solid rgba(251,191,36,.2)", borderRadius: 4, padding: "1px 6px", letterSpacing: "0.06em" }}>◎ AI ESTIMATE</span>
                    )}
                  </div>
                </div>
                <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", color: T.mu, cursor: "pointer", fontSize: 18, padding: "0 0 0 8px", lineHeight: 1 }}>×</button>
              </div>

              {/* Portion scale chips */}
              <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                {SCALE_OPTS.map(s => (
                  <button key={s} onClick={() => setScale(i, s)} style={{ padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${item.scale === s ? T.brand : T.bd}`, background: item.scale === s ? `${T.brand}18` : "none", color: item.scale === s ? T.brand : T.mu, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    {SCALE_LABELS[s]}
                  </button>
                ))}
              </div>

              {/* Macros row */}
              <div style={{ display: "flex", gap: 10 }}>
                {[["Cal", v.calories, "", "#fff"], ["P", v.protein, "g", T.prot], ["C", v.carbs, "g", T.carb], ["F", v.fat, "g", T.fat]].map(([l, val, u, c]) => (
                  <div key={l} style={{ textAlign: "center", flex: 1, background: T.s2, borderRadius: 8, padding: "6px 4px" }}>
                    <div style={{ fontSize: 9, color: T.mu, textTransform: "uppercase", letterSpacing: 1, marginBottom: 1 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: c }}>{val}{u}</div>
                  </div>
                ))}
              </div>

              {item.notes && (
                <div style={{ fontSize: 10, color: T.mu, marginTop: 8, fontStyle: "italic" }}>Note: {item.notes}</div>
              )}
            </div>
          );
        })}

        {/* Add ingredient */}
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)} style={{ width: "100%", padding: "12px", borderRadius: 12, border: `1.5px dashed ${T.bd}`, background: "none", color: T.mu, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            + Add missing ingredient
          </button>
        ) : (
          <div style={{ background: T.s1, border: `1px solid ${T.brand}40`, borderRadius: 14, padding: "14px", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.brand, marginBottom: 10, letterSpacing: "0.06em" }}>ADD INGREDIENT</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="Food name *" style={{ background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
              <input value={addForm.portion} onChange={e => setAddForm(f => ({ ...f, portion: e.target.value }))} placeholder="Portion (e.g. 1 cup, 4 oz)" style={{ background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 6 }}>
                {[["calories","Cal *"],["protein","Prot"],["carbs","Carbs"],["fat","Fat"]].map(([k, ph]) => (
                  <input key={k} type="number" value={addForm[k]} onChange={e => setAddForm(f => ({ ...f, [k]: e.target.value }))} placeholder={ph} style={{ flex: 1, background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "8px 6px", color: "#fff", fontSize: 12, fontFamily: "inherit", textAlign: "center", minWidth: 0 }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addIngredient} style={{ flex: 1, padding: "10px", borderRadius: 10, background: T.brand, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
                <button onClick={() => { setShowAdd(false); setAddForm({ name: "", portion: "", calories: "", protein: "", carbs: "", fat: "" }); }} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "none", border: `1px solid ${T.bd}`, color: T.mu, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {analysis.suggestions && (
          <div style={{ background: `${T.prot}10`, border: `1px solid ${T.prot}25`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: T.prot }}>
            💡 {analysis.suggestions}
          </div>
        )}

        {/* Totals bar */}
        <div style={{ background: T.s1, border: `1px solid ${T.bd}`, borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'DM Mono',monospace" }}>Meal Totals</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[["Calories", totals.calories, "", "#fff"], ["Protein", totals.protein, "g", T.prot], ["Carbs", totals.carbs, "g", T.carb], ["Fat", totals.fat, "g", T.fat]].map(([l, v, u, c]) => (
              <div key={l} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: T.mu, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: c, lineHeight: 1 }}>{v}{u}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={handleLog}
          disabled={activeItems.length === 0}
          style={{ width: "100%", padding: "16px", borderRadius: 14, background: activeItems.length ? T.brand : T.bd, border: "none", color: "#fff", fontSize: 17, fontWeight: 800, cursor: activeItems.length ? "pointer" : "default", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.08em", marginBottom: 10 }}
        >
          LOG THIS MEAL
        </button>
        <button onClick={onRetake} style={{ width: "100%", padding: "13px", borderRadius: 14, background: "none", border: `1.5px solid ${T.bd}`, color: T.mu, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.06em", marginBottom: 10 }}>
          Retake Photo
        </button>
        <button onClick={onClose} style={{ width: "100%", padding: "10px", background: "none", border: "none", color: T.mu, fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 24 }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Error Screen ──────────────────────────────────────────────────────────────

function ErrorScreen({ message, onRetry, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,13,26,.97)", zIndex: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Analysis Failed</div>
      <div style={{ fontSize: 13, color: T.mu, lineHeight: 1.6, marginBottom: 32, maxWidth: 280 }}>{message || "Could not analyze the photo. Try again or log manually."}</div>
      <button onClick={onRetry} style={{ width: "100%", maxWidth: 280, padding: "14px", borderRadius: 12, background: T.brand, border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>
        Try Again
      </button>
      <button onClick={onClose} style={{ background: "none", border: "none", color: T.mu, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
    </div>
  );
}

// ── Main PhotoFoodLogger ──────────────────────────────────────────────────────

export default function PhotoFoodLogger({ user, profile, onLog, onClose }) {
  const tutorialDone = localStorage.getItem("cm_photo_tutorial") === "1";
  const [phase, setPhase] = useState(tutorialDone ? "camera" : "tutorial");
  const [photoMode, setPhotoMode] = useState("photo");
  const [useFallback, setUseFallback] = useState(false);
  const [capturedBase64, setCapturedBase64] = useState(null);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const abortRef = useRef(false);

  async function handleCapture(raw64, dataUrl) {
    abortRef.current = false;
    setPreviewDataUrl(dataUrl);

    let resized;
    try {
      resized = await resizeImageBase64(raw64, 800);
    } catch {
      resized = raw64;
    }
    setCapturedBase64(resized);

    if (photoMode === "photo+text") {
      setPhase("notes");
    } else {
      await handleAnalyze("", resized);
    }
  }

  async function handleAnalyze(description, base64Override) {
    const b64 = base64Override || capturedBase64;
    if (!b64) return;
    abortRef.current = false;
    setPhase("analyzing");

    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) {
        setErrorMsg("You need to be signed in to use photo logging.");
        setPhase("error");
        return;
      }

      const body = { image: b64, mediaType: "image/jpeg" };
      if (description) body.userDescription = description;

      const resp = await fetch(`${API_BASE}/api/food-photo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (abortRef.current) return;

      const data = await resp.json();

      if (!resp.ok) {
        const reason = data.reason;
        if (reason === "subscription_required") {
          setErrorMsg("Photo logging is a Pro feature. Upgrade to unlock.");
        } else if (reason === "daily_limit") {
          // Coach-voiced — not an error alert, just a calm daily cap message
          setErrorMsg(data.message || "You've used all your AI credits for today. They reset at midnight. Core tracking still works normally.");
        } else {
          setErrorMsg(data.error || "Analysis failed. Try again.");
        }
        setPhase("error");
        return;
      }

      if (data.error) {
        setErrorMsg(data.error === "No food detected" ? "No food detected in the photo. Try a clearer shot." : data.error);
        setPhase("error");
        return;
      }

      setAnalysis(data);
      setPhase("confirm");
    } catch (e) {
      if (abortRef.current) return;
      setErrorMsg("Network error. Check your connection and try again.");
      setPhase("error");
    }
  }

  async function handleLog(items, totals, corrections) {
    const photoUrl = user?.id ? await uploadPhoto(user.id, capturedBase64) : null;
    if (user?.id && !photoUrl) showToast("Items logged — photo thumbnail upload failed");

    // Save corrections for future calibration
    if (user?.id && corrections?.length) {
      const rows = corrections
        .filter(c => c.ai_identified && (c.user_corrected_to || c.portion_adjustment))
        .map(c => ({ user_id: user.id, ...c }));
      if (rows.length) {
        sb.from("photo_log_corrections").insert(rows).catch(() => {});
      }
    }

    const entries = items.map(item => ({
      ...item,
      method: "photo",
      photo_url: photoUrl,
    }));

    onLog(entries);
    if (photoUrl) showToast(`Logged ${items.length} item${items.length !== 1 ? "s" : ""} from photo`);
  }

  function handleRetake() {
    abortRef.current = true;
    setCapturedBase64(null);
    setPreviewDataUrl(null);
    setAnalysis(null);
    setErrorMsg(null);
    setPhase("camera");
    setUseFallback(false);
  }

  return (
    <>
      {phase === "tutorial" && <Tutorial onDone={() => setPhase("camera")} />}

      {phase === "camera" && !useFallback && (
        <CameraScreen
          onCapture={handleCapture}
          onClose={onClose}
          onFallback={() => setUseFallback(true)}
          photoMode={photoMode}
          setPhotoMode={setPhotoMode}
        />
      )}

      {phase === "camera" && useFallback && (
        <FilePicker
          onCapture={handleCapture}
          onClose={onClose}
        />
      )}

      {phase === "notes" && (
        <NotesScreen
          previewDataUrl={previewDataUrl}
          onAnalyze={(desc) => handleAnalyze(desc)}
          onSkip={() => handleAnalyze("")}
          onCancel={() => { abortRef.current = true; onClose(); }}
        />
      )}

      {phase === "analyzing" && (
        <AnalyzingScreen
          previewDataUrl={previewDataUrl}
          onCancel={() => { abortRef.current = true; onClose(); }}
        />
      )}

      {phase === "confirm" && analysis && (
        <ConfirmScreen
          analysis={analysis}
          previewDataUrl={previewDataUrl}
          onLog={handleLog}
          onRetake={handleRetake}
          onClose={onClose}
        />
      )}

      {phase === "error" && (
        <ErrorScreen
          message={errorMsg}
          onRetry={handleRetake}
          onClose={onClose}
        />
      )}
    </>
  );
}
