import React, { useState, useRef, useEffect } from "react";
import { T } from "./components.jsx";
import { sb } from "./client.js";
import { showToast } from "./utils/toast.js";
import { ensureAIConsent } from "./services/aiConsent.js";

// NOTE: photo-log historically read VITE_API_BASE, but only VITE_API_BASE_URL is
// actually set (that's what client.js uses). Unset → API_BASE="" → a RELATIVE
// /api/food-photo that can't resolve in the native WebView → "network error".
// Fall back to VITE_API_BASE_URL so the call reaches the deployed proxy.
const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || "";

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
    // The food-photos bucket is PRIVATE — return the storage PATH (not a public URL).
    // `photo_url` in food_logs.entries now holds this path; the food log signs it
    // on display via createSignedUrl (owner-scoped), so photos stay owner-only.
    return path;
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
    (analysis.items || []).map(item => {
      // Real single-serving basis from the AI (label + per-serving macros). Guard:
      // only treat as valid if per-serving calories are present & positive.
      const svg = item.serving && Number(item.serving.calories) > 0
        ? {
            label:    item.serving.label || "1 serving",
            grams:    Number(item.serving.grams) || 0,
            calories: Number(item.serving.calories) || 0,
            protein:  Number(item.serving.protein)  || 0,
            carbs:    Number(item.serving.carbs)    || 0,
            fat:      Number(item.serving.fat)      || 0,
          }
        : null;
      const est = Number(item.estimated_servings) > 0 ? Number(item.estimated_servings) : null;
      return {
        ...item,
        aiName: item.name,
        serving: svg,
        estServings: est,
        servings: svg ? 1 : null,   // DEFAULT to ONE real serving — not the whole container
        scale: 1,                   // fallback multiplier for items with no serving data
        customUnit: "serving",
        customVal: "",
        _removed: false,
      };
    })
  );
  const [editingIdx, setEditingIdx] = useState(null);
  const [editName, setEditName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", portion: "", calories: "", protein: "", carbs: "", fat: "" });

  const r1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

  // Macros for the amount the user actually chose. Serving-anchored items compute
  // from the real single-serving basis × chosen servings; items without serving
  // data fall back to the AI's as-seen macros × a multiplier.
  function itemMacros(item) {
    if (item.serving && item.servings != null) {
      const n = item.servings;
      return {
        calories: Math.round(item.serving.calories * n),
        protein:  r1(item.serving.protein * n),
        carbs:    r1(item.serving.carbs   * n),
        fat:      r1(item.serving.fat     * n),
      };
    }
    const s = item.scale;
    return {
      calories: Math.round(item.calories * s),
      protein:  r1(item.protein * s),
      carbs:    r1(item.carbs   * s),
      fat:      r1(item.fat     * s),
    };
  }

  // Human label of the chosen amount (for the logged entry's portion field)
  function amountLabel(item) {
    if (item.serving && item.servings != null) {
      if (item.customVal && item.customUnit !== "serving") return `${item.customVal} ${item.customUnit}`;
      const n = r1(item.servings);
      return `${n} serving${n === 1 ? "" : "s"} (${item.serving.label})`;
    }
    return item.scale === 1 ? item.portion : `${item.portion} × ${item.scale}`;
  }

  const amtChanged = (item) => item.serving ? item.servings !== 1 : item.scale !== 1;

  const activeItems = items.filter(i => !i._removed);

  const totals = activeItems.reduce((acc, item) => {
    const v = itemMacros(item);
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

  // Serving-anchored: pick a whole-serving quick amount (clears any custom entry)
  function setServings(idx, servings) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, servings, customVal: "", customUnit: "serving" } : item));
  }

  // Serving-anchored custom amount: value + unit (serving | g | oz) → canonical servings
  function setCustom(idx, rawVal, unit) {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const val = parseFloat(rawVal);
      let servings = item.servings;
      if (!isNaN(val) && val >= 0) {
        if (unit === "serving") servings = val;
        else if (item.serving?.grams > 0) {
          const grams = unit === "oz" ? val * 28.3495 : val;
          servings = grams / item.serving.grams;
        }
      }
      return { ...item, customVal: rawVal, customUnit: unit, servings };
    }));
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
      serving: null,
      estServings: null,
      servings: null,
      scale: 1,
      customUnit: "serving",
      customVal: "",
      _removed: false,
    };
    setItems(prev => [...prev, newItem]);
    setAddForm({ name: "", portion: "", calories: "", protein: "", carbs: "", fat: "" });
    setShowAdd(false);
  }

  function handleLog() {
    const corrections = items
      .filter(item => !item._removed && (item.name !== item.aiName || amtChanged(item)))
      .map(item => ({
        ai_identified: item.aiName,
        user_corrected_to: item.name !== item.aiName ? item.name : null,
        portion_adjustment: amtChanged(item) ? (item.serving ? item.servings : item.scale) : null,
      }));

    const loggableItems = activeItems.map(item => {
      const v = itemMacros(item);
      return {
        id: Date.now() + Math.random(),
        food: item.name,
        calories: v.calories,
        protein:  v.protein,
        carbs:    v.carbs,
        fat:      v.fat,
        method: "photo",
        portion: amountLabel(item),
      };
    });

    onLog(loggableItems, totals, corrections);
  }

  // Brand tokens — adapt to the user's chosen theme via --cm-* (was hardcoded dark `T`).
  const ui = {
    red: "var(--cm-red,#FF3B30)", paper: "var(--cm-paper,#FFFFFF)", ink: "var(--cm-ink,#0A0A0A)",
    af: "'Archivo',sans-serif", mono: "'DM Mono',monospace",
    prot: "var(--cm-red,#FF3B30)", carb: "#3B82F6", fat: "#F59E0B",
  };
  const mut = (a) => `rgba(var(--cm-ink-rgb,10,10,10),${a})`;   // muted ink on paper cards
  const conf = { high: "#16a34a", medium: "#d97706", low: "rgba(255,255,255,0.75)" }[analysis.confidence] || "rgba(255,255,255,0.75)";

  return (
    <div style={{ position: "fixed", inset: 0, background: ui.red, zIndex: 500, overflowY: "auto" }}>
      {/* Header — white on the themed canvas */}
      <div style={{ padding: "52px 20px 0", display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: ui.af, fontStyle: "italic", fontWeight: 900, fontSize: 30, lineHeight: 1.05, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.01em" }}>Here's what I see</div>
          {analysis.confidence && (
            <div style={{ fontFamily: ui.mono, fontSize: 10.5, color: "#fff", fontWeight: 500, marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999, padding: "3px 11px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: conf }} />
              {analysis.confidence.toUpperCase()} CONFIDENCE
            </div>
          )}
        </div>
        {previewDataUrl && (
          <img src={previewDataUrl} alt="" style={{ width: 64, height: 64, borderRadius: 14, objectFit: "cover", border: "2px solid rgba(255,255,255,0.35)", flexShrink: 0 }} />
        )}
      </div>

      <div style={{ padding: "0 20px 12px" }}>
        {/* Items list */}
        {items.map((item, i) => {
          if (item._removed) return (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 4px" }}>
              <div style={{ fontFamily: ui.af, fontSize: 13, textDecoration: "line-through", color: "rgba(255,255,255,0.55)" }}>{item.name}</div>
              <button onClick={() => undoRemove(i)} style={{ background: "none", border: "none", color: "#fff", fontFamily: ui.af, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Undo</button>
            </div>
          );

          const v = itemMacros(item);
          const isEditing = editingIdx === i;

          return (
            <div key={i} style={{ background: ui.paper, border: `1px solid ${mut(0.08)}`, borderRadius: 16, padding: "14px", marginBottom: 10, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1, marginRight: 8 }}>
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onBlur={() => commitEditName(i)}
                      onKeyDown={e => { if (e.key === "Enter") commitEditName(i); if (e.key === "Escape") setEditingIdx(null); }}
                      style={{ width: "100%", background: mut(0.04), border: `1px solid ${ui.red}`, borderRadius: 8, padding: "5px 9px", color: ui.ink, fontSize: 15, fontWeight: 700, fontFamily: ui.af, boxSizing: "border-box" }}
                    />
                  ) : (
                    <button onClick={() => startEditName(i, item.name)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", width: "100%" }}>
                      <div style={{ fontFamily: ui.af, fontSize: 15, fontWeight: 700, color: ui.ink }}>{item.name}</div>
                    </button>
                  )}
                  <div style={{ fontFamily: ui.mono, fontSize: 11, color: mut(0.5), marginTop: 2 }}>{item.portion}</div>

                  {/* Source badge */}
                  <div style={{ marginTop: 6 }}>
                    {item.source === "usda" ? (
                      <span style={{ fontFamily: ui.mono, fontSize: 9, fontWeight: 500, color: "#16a34a", background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 5, padding: "2px 7px", letterSpacing: "0.06em" }}>✓ DATABASE VERIFIED</span>
                    ) : item.source === "manual" ? (
                      <span style={{ fontFamily: ui.mono, fontSize: 9, fontWeight: 500, color: mut(0.5), background: mut(0.06), borderRadius: 5, padding: "2px 7px", letterSpacing: "0.06em" }}>MANUAL ENTRY</span>
                    ) : (
                      <span style={{ fontFamily: ui.mono, fontSize: 9, fontWeight: 500, color: "#d97706", background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.22)", borderRadius: 5, padding: "2px 7px", letterSpacing: "0.06em" }}>◎ AI ESTIMATE</span>
                    )}
                  </div>
                </div>
                <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", color: mut(0.4), cursor: "pointer", fontSize: 20, padding: "0 0 0 8px", lineHeight: 1 }}>×</button>
              </div>

              {/* Amount selector — "how much did you eat?", anchored to a real serving */}
              {item.serving ? (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: ui.mono, fontSize: 9, color: mut(0.45), letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>
                    How much did you eat? · 1 serving = {item.serving.label} · {item.serving.calories} cal
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {[
                      { lbl: "½", n: 0.5 },
                      { lbl: `1 (${item.serving.label})`, n: 1 },
                      { lbl: "2", n: 2 },
                      ...(item.estServings && item.estServings > 2 ? [{ lbl: `All ~${Math.round(item.estServings)}`, n: item.estServings }] : []),
                    ].map(({ lbl, n }) => {
                      const active = !item.customVal && Math.abs((item.servings ?? -1) - n) < 0.01;
                      return (
                        <button key={lbl} onClick={() => setServings(i, n)} style={{ padding: "6px 13px", borderRadius: 999, border: `1.5px solid ${active ? ui.red : mut(0.15)}`, background: active ? "rgba(var(--cm-red-rgb,255,59,48),0.1)" : "none", color: active ? ui.red : mut(0.6), fontFamily: ui.af, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{lbl}</button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="number" inputMode="decimal" placeholder="Custom"
                      value={item.customVal}
                      onChange={e => setCustom(i, e.target.value, item.customUnit)}
                      style={{ width: 78, background: mut(0.04), border: `1px solid ${item.customVal ? ui.red : mut(0.12)}`, borderRadius: 8, padding: "7px 9px", color: ui.ink, fontFamily: ui.mono, fontSize: 13, boxSizing: "border-box" }}
                    />
                    <div style={{ display: "flex", gap: 4 }}>
                      {["serving", ...(item.serving.grams > 0 ? ["g", "oz"] : [])].map(u => (
                        <button key={u} onClick={() => setCustom(i, item.customVal, u)} style={{ padding: "6px 11px", borderRadius: 8, border: `1.5px solid ${item.customUnit === u ? ui.red : mut(0.15)}`, background: item.customUnit === u ? "rgba(var(--cm-red-rgb,255,59,48),0.1)" : "none", color: item.customUnit === u ? ui.red : mut(0.55), fontFamily: ui.af, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{u === "serving" ? "servings" : u}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: ui.mono, fontSize: 9, color: mut(0.45), letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>
                    How much of this did you eat?
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[["¼", 0.25], ["½", 0.5], ["¾", 0.75], ["All", 1], ["1½×", 1.5]].map(([lbl, s]) => (
                      <button key={lbl} onClick={() => setScale(i, s)} style={{ padding: "6px 13px", borderRadius: 999, border: `1.5px solid ${item.scale === s ? ui.red : mut(0.15)}`, background: item.scale === s ? "rgba(var(--cm-red-rgb,255,59,48),0.1)" : "none", color: item.scale === s ? ui.red : mut(0.6), fontFamily: ui.af, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{lbl}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Macros row */}
              <div style={{ display: "flex", gap: 8 }}>
                {[["Cal", v.calories, "", ui.ink], ["P", v.protein, "g", ui.prot], ["C", v.carbs, "g", ui.carb], ["F", v.fat, "g", ui.fat]].map(([l, val, u, c]) => (
                  <div key={l} style={{ textAlign: "center", flex: 1, background: mut(0.04), borderRadius: 10, padding: "7px 4px" }}>
                    <div style={{ fontFamily: ui.mono, fontSize: 9, color: mut(0.45), textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{l}</div>
                    <div style={{ fontFamily: ui.mono, fontSize: 15, fontWeight: 500, color: c }}>{val}{u}</div>
                  </div>
                ))}
              </div>

              {item.notes && (
                <div style={{ fontFamily: ui.af, fontSize: 11, color: mut(0.5), marginTop: 8, fontStyle: "italic", lineHeight: 1.4 }}>Note: {item.notes}</div>
              )}
            </div>
          );
        })}

        {/* Add ingredient */}
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)} style={{ width: "100%", padding: "13px", borderRadius: 14, border: "1.5px dashed rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.08)", color: "#fff", fontFamily: ui.af, fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            + Add missing ingredient
          </button>
        ) : (
          <div style={{ background: ui.paper, border: `1px solid ${mut(0.08)}`, borderRadius: 16, padding: "14px", marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div style={{ fontFamily: ui.mono, fontSize: 11, fontWeight: 500, color: ui.red, marginBottom: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Add ingredient</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="Food name *" style={{ background: mut(0.04), border: `1px solid ${mut(0.12)}`, borderRadius: 8, padding: "9px 11px", color: ui.ink, fontSize: 13, fontFamily: ui.af, width: "100%", boxSizing: "border-box" }} />
              <input value={addForm.portion} onChange={e => setAddForm(f => ({ ...f, portion: e.target.value }))} placeholder="Portion (e.g. 1 cup, 4 oz)" style={{ background: mut(0.04), border: `1px solid ${mut(0.12)}`, borderRadius: 8, padding: "9px 11px", color: ui.ink, fontSize: 13, fontFamily: ui.af, width: "100%", boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 6 }}>
                {[["calories","Cal *"],["protein","Prot"],["carbs","Carbs"],["fat","Fat"]].map(([k, ph]) => (
                  <input key={k} type="number" value={addForm[k]} onChange={e => setAddForm(f => ({ ...f, [k]: e.target.value }))} placeholder={ph} style={{ flex: 1, background: mut(0.04), border: `1px solid ${mut(0.12)}`, borderRadius: 8, padding: "9px 6px", color: ui.ink, fontSize: 12, fontFamily: ui.mono, textAlign: "center", minWidth: 0 }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addIngredient} style={{ flex: 1, padding: "11px", borderRadius: 10, background: ui.red, border: "none", color: "#fff", fontFamily: ui.af, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add</button>
                <button onClick={() => { setShowAdd(false); setAddForm({ name: "", portion: "", calories: "", protein: "", carbs: "", fat: "" }); }} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "none", border: `1px solid ${mut(0.15)}`, color: mut(0.6), fontFamily: ui.af, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {analysis.suggestions && (
          <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "11px 14px", marginBottom: 16, fontFamily: ui.af, fontSize: 12.5, color: "#fff", lineHeight: 1.45 }}>
            💡 {analysis.suggestions}
          </div>
        )}

        {/* Totals bar */}
        <div style={{ background: ui.paper, border: `1px solid ${mut(0.08)}`, borderRadius: 16, padding: "16px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ fontFamily: ui.mono, fontSize: 10, color: ui.red, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 12 }}>Meal Totals</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[["Calories", totals.calories, "", ui.ink], ["Protein", totals.protein, "g", ui.prot], ["Carbs", totals.carbs, "g", ui.carb], ["Fat", totals.fat, "g", ui.fat]].map(([l, v, u, c]) => (
              <div key={l} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontFamily: ui.mono, fontSize: 9, color: mut(0.45), textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{l}</div>
                <div style={{ fontFamily: ui.mono, fontSize: 22, fontWeight: 500, color: c, lineHeight: 1 }}>{v}{u}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={handleLog}
          disabled={activeItems.length === 0}
          style={{ width: "100%", padding: "16px", borderRadius: 16, background: activeItems.length ? "#fff" : "rgba(255,255,255,0.4)", border: "none", color: ui.red, fontFamily: ui.af, fontStyle: "italic", fontWeight: 900, fontSize: 18, letterSpacing: "0.02em", textTransform: "uppercase", cursor: activeItems.length ? "pointer" : "default", marginBottom: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
        >
          Log this meal
        </button>
        <button onClick={onRetake} style={{ width: "100%", padding: "13px", borderRadius: 14, background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff", fontFamily: ui.af, fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>
          Retake photo
        </button>
        <button onClick={onClose} style={{ width: "100%", padding: "10px", background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontFamily: ui.af, fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 24 }}>
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
    // AI consent gate — a food photo goes to Anthropic. Off/declined → cancel (stay on preview).
    if (!(await ensureAIConsent())) return;
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
        // "Couldn't identify food" — a clean AI result (200), NOT a failure. Give it
        // its own clear, non-alarming message distinct from a genuine error.
        setErrorMsg(data.error === "No food detected"
          ? "Couldn't identify any food in this photo. Try a clearer, well-lit shot of the plate."
          : data.error);
        setPhase("error");
        return;
      }

      setAnalysis(data);
      setPhase("confirm");
    } catch (e) {
      if (abortRef.current) return;
      // Genuine failure path — distinguish a real connectivity problem (fetch throws
      // TypeError) from an unexpected app error. Neither is the "no food found" case
      // above, so never mislabel those as a network problem.
      setErrorMsg(e instanceof TypeError
        ? "Couldn't reach the analysis service. Check your connection and try again."
        : "Something went wrong analyzing your photo. Try again.");
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
        (async()=>{try{await sb.from("photo_log_corrections").insert(rows);}catch(e){console.warn('[photo_log_corrections insert]',e);}})();
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
