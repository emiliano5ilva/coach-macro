import React, { useState, useRef, useEffect, useCallback } from "react";
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

const TUTORIAL_STEPS = [
  {
    icon: "📸",
    title: "Point & Shoot",
    body: "Take a photo of your full plate. Include everything you plan to eat.",
  },
  {
    icon: "🧠",
    title: "AI Identifies Foods",
    body: "Claude scans your meal and estimates portions and macros for each item.",
  },
  {
    icon: "✅",
    title: "Review & Log",
    body: "Adjust any portion sizes, then tap Log to add everything at once.",
  },
];

function Tutorial({ onDone }) {
  const [step, setStep] = useState(0);
  const s = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,13,26,.96)", zIndex: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ maxWidth: 340, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>{s.icon}</div>
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

function CameraScreen({ onCapture, onClose, onFallback }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [torch, setTorch] = useState(false);
  const [permDenied, setPermDenied] = useState(false);

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
        <div style={{ fontSize: 48, marginBottom: 20 }}>📷</div>
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
      {/* Live preview */}
      <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />

      {/* Corner guides */}
      {ready && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {[["top:15%,left:10%","top right"],["top:15%,right:10%","top left"],["bottom:20%,left:10%","bottom right"],["bottom:20%,right:10%","bottom left"]].map(([pos, corners], idx) => {
            const style = Object.fromEntries(pos.split(",").map(p => p.split(":")));
            return (
              <div key={idx} style={{ position: "absolute", width: 40, height: 40, ...style }}>
                <svg width="40" height="40" viewBox="0 0 40 40">
                  {corners.includes("top") && corners.includes("left") && <>
                    <path d="M2 14 L2 2 L14 2" stroke="rgba(255,255,255,.7)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  </>}
                  {corners.includes("top") && corners.includes("right") && <>
                    <path d="M26 2 L38 2 L38 14" stroke="rgba(255,255,255,.7)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  </>}
                  {corners.includes("bottom") && corners.includes("left") && <>
                    <path d="M2 26 L2 38 L14 38" stroke="rgba(255,255,255,.7)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  </>}
                  {corners.includes("bottom") && corners.includes("right") && <>
                    <path d="M26 38 L38 38 L38 26" stroke="rgba(255,255,255,.7)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  </>}
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
          {torch ? "⚡ On" : "⚡ Flash"}
        </button>
      </div>

      {/* Bottom capture controls */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 32px 52px", display: "flex", justifyContent: "center", alignItems: "center", gap: 40, background: "linear-gradient(to top,rgba(0,0,0,.7),transparent)" }}>
        <button onClick={onFallback} style={{ background: "rgba(255,255,255,.15)", border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 12, padding: "10px 16px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "center", lineHeight: 1.3 }}>
          📁<br/>Library
        </button>
        <button
          onClick={capture}
          disabled={!ready}
          style={{ width: 72, height: 72, borderRadius: "50%", background: ready ? T.brand : T.bd, border: "4px solid rgba(255,255,255,.6)", cursor: ready ? "pointer" : "default", flexShrink: 0, transition: "all .15s", transform: ready ? "scale(1)" : "scale(.9)" }}
        />
        <div style={{ width: 56 }} />
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
    const total = 8000;
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
      <div style={{ fontSize: 13, color: T.mu, marginBottom: 28 }}>Identifying foods and estimating macros</div>
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
  const [scales, setScales] = useState(() =>
    (analysis.items || []).reduce((acc, _, i) => ({ ...acc, [i]: 1 }), {})
  );
  const [removed, setRemoved] = useState({});

  const items = (analysis.items || []).filter((_, i) => !removed[i]);

  function scaledItem(item, idx) {
    const s = scales[idx] ?? 1;
    return {
      ...item,
      calories: Math.round(item.calories * s),
      protein: Math.round(item.protein * s * 10) / 10,
      carbs: Math.round(item.carbs * s * 10) / 10,
      fat: Math.round(item.fat * s * 10) / 10,
    };
  }

  const activeItems = (analysis.items || [])
    .map((item, i) => removed[i] ? null : scaledItem(item, i))
    .filter(Boolean);

  const totals = activeItems.reduce((acc, item) => ({
    calories: acc.calories + item.calories,
    protein: acc.protein + item.protein,
    carbs: acc.carbs + item.carbs,
    fat: acc.fat + item.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

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

      {/* Items list */}
      <div style={{ padding: "0 20px 12px" }}>
        {(analysis.items || []).map((item, i) => {
          if (removed[i]) return (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", opacity: 0.4 }}>
              <div style={{ fontSize: 13, textDecoration: "line-through", color: T.mu }}>{item.name}</div>
              <button onClick={() => setRemoved(r => ({ ...r, [i]: false }))} style={{ background: "none", border: "none", color: T.brand, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Undo</button>
            </div>
          );

          const scaled = scaledItem(item, i);
          return (
            <div key={i} style={{ background: T.s1, border: `1px solid ${T.bd}`, borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: T.mu, marginTop: 1 }}>{item.portion}</div>
                </div>
                <button onClick={() => setRemoved(r => ({ ...r, [i]: true }))} style={{ background: "none", border: "none", color: T.mu, cursor: "pointer", fontSize: 16, padding: "0 0 0 8px" }}>×</button>
              </div>

              {/* Portion scale chips */}
              <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                {SCALE_OPTS.map(s => (
                  <button key={s} onClick={() => setScales(sc => ({ ...sc, [i]: s }))} style={{ padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${scales[i] === s ? T.brand : T.bd}`, background: scales[i] === s ? `${T.brand}18` : "none", color: scales[i] === s ? T.brand : T.mu, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    {SCALE_LABELS[s]}
                  </button>
                ))}
              </div>

              {/* Macros row */}
              <div style={{ display: "flex", gap: 10 }}>
                {[["Cal", scaled.calories, "", "#fff"], ["P", scaled.protein, "g", T.prot], ["C", scaled.carbs, "g", T.carb], ["F", scaled.fat, "g", T.fat]].map(([l, v, u, c]) => (
                  <div key={l} style={{ textAlign: "center", flex: 1, background: T.s2, borderRadius: 8, padding: "6px 4px" }}>
                    <div style={{ fontSize: 9, color: T.mu, textTransform: "uppercase", letterSpacing: 1, marginBottom: 1 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: c }}>{v}{u}</div>
                  </div>
                ))}
              </div>

              {item.notes && (
                <div style={{ fontSize: 10, color: T.mu, marginTop: 8, fontStyle: "italic" }}>Note: {item.notes}</div>
              )}
            </div>
          );
        })}

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
          onClick={() => onLog(activeItems, totals)}
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

export default function PhotoFoodLogger({ user, profile, onLog, onClose, log }) {
  const tutorialDone = localStorage.getItem("cm_photo_tutorial") === "1";
  const [phase, setPhase] = useState(tutorialDone ? "camera" : "tutorial");
  const [useFallback, setUseFallback] = useState(false);
  const [capturedBase64, setCapturedBase64] = useState(null);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const abortRef = useRef(false);

  async function handleCapture(raw64, dataUrl) {
    abortRef.current = false;
    setPreviewDataUrl(dataUrl);
    setPhase("analyzing");

    let resized;
    try {
      resized = await resizeImageBase64(raw64, 800);
    } catch {
      resized = raw64;
    }
    setCapturedBase64(resized);

    try {
      const resp = await fetch(`${API_BASE}/api/food-photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user?.id || "" },
        body: JSON.stringify({ image: resized, mediaType: "image/jpeg" }),
      });

      if (abortRef.current) return;

      const data = await resp.json();

      if (!resp.ok) {
        const reason = data.reason;
        if (reason === "subscription_required") {
          setErrorMsg("Photo logging is a Pro feature. Upgrade to unlock.");
        } else if (reason === "rate_limit") {
          setErrorMsg("Too many photo logs this hour. Try again later.");
        } else if (reason === "monthly_limit") {
          setErrorMsg("Monthly AI limit reached. Resets on the 1st.");
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

  async function handleLog(items, totals) {
    const photoUrl = user?.id ? await uploadPhoto(user.id, capturedBase64) : null;

    const entries = items.map(item => ({
      id: Date.now() + Math.random(),
      food: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      method: "photo",
      photo_url: photoUrl,
      portion: item.portion,
    }));

    onLog(entries);
    showToast(`Logged ${items.length} item${items.length !== 1 ? "s" : ""} from photo`);
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
        />
      )}

      {phase === "camera" && useFallback && (
        <FilePicker
          onCapture={handleCapture}
          onClose={onClose}
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
