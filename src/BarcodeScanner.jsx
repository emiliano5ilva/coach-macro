import React, { useEffect, useRef, useState, useCallback } from "react";
import { T } from "./components.jsx";

// Uses browser-native BarcodeDetector API (Chrome/Edge/Android).
// Falls back gracefully to manual entry on Safari/Firefox.
const hasBarcodeDetector = () =>
  typeof window !== "undefined" && "BarcodeDetector" in window;

export default function BarcodeScanner({ onDetected, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const [phase, setPhase] = useState("init"); // init | scanning | denied | unsupported
  const [manualInput, setManualInput] = useState("");

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!hasBarcodeDetector()) {
      setPhase("unsupported");
      return;
    }

    let active = true;

    async function start() {
      try {
        detectorRef.current = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
        });
      } catch {
        if (active) setPhase("unsupported");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 } },
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (active) { setPhase("scanning"); scheduleScan(); }
          };
        }
      } catch (e) {
        if (!active) return;
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          setPhase("denied");
        } else {
          setPhase("unsupported");
        }
      }
    }

    function scheduleScan() {
      rafRef.current = requestAnimationFrame(async () => {
        if (!active || !videoRef.current || !detectorRef.current) return;
        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          if (codes.length > 0) {
            stopCamera();
            onDetected(codes[0].rawValue);
            return;
          }
        } catch {}
        if (active) scheduleScan();
      });
    }

    start();
    return () => {
      active = false;
      stopCamera();
    };
  }, [onDetected, stopCamera]);

  if (phase === "unsupported") {
    return (
      <div style={{ padding: "20px 0" }}>
        <div style={{ background: T.s1, border: `1px solid ${T.bd}`, borderRadius: 14, padding: "18px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Camera scanning not supported on this browser</div>
          <div style={{ fontSize: 12, color: T.mu, lineHeight: 1.5 }}>
            Use your phone's camera app to scan the barcode — it will show the number. Paste it below.
          </div>
        </div>
        <ManualEntry value={manualInput} onChange={setManualInput} onSubmit={() => onDetected(manualInput.trim())} onCancel={onCancel} />
      </div>
    );
  }

  if (phase === "denied") {
    return (
      <div style={{ padding: "20px 0" }}>
        <div style={{ background: `rgba(239,68,68,.08)`, border: `1px solid rgba(239,68,68,.3)`, borderRadius: 14, padding: "18px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#f87171" }}>Camera access denied</div>
          <div style={{ fontSize: 12, color: T.mu, lineHeight: 1.55, marginBottom: 10 }}>
            To scan barcodes, allow camera access in:<br/>
            <strong style={{ color: "#fff" }}>Settings → Coach Macro → Camera → Allow</strong>
          </div>
          <button
            onClick={() => { if (window.Capacitor?.Plugins?.App?.openUrl) { window.Capacitor.Plugins.App.openUrl({ url: "app-settings:" }); } }}
            style={{ padding: "8px 16px", borderRadius: 20, background: "rgba(239,68,68,.2)", border: "1px solid rgba(239,68,68,.4)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            Open Settings
          </button>
        </div>
        <ManualEntry value={manualInput} onChange={setManualInput} onSubmit={() => onDetected(manualInput.trim())} onCancel={onCancel} />
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Camera viewport */}
      <div style={{ borderRadius: 16, overflow: "hidden", position: "relative", background: "#000", aspectRatio: "4/3", marginBottom: 12 }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", display: phase === "scanning" ? "block" : "none" }}
        />

        {phase === "init" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 13, color: T.mu }}>Starting camera…</div>
          </div>
        )}

        {phase === "scanning" && (
          <>
            {/* Corner brackets */}
            <div style={{ position: "absolute", inset: "20%", pointerEvents: "none" }}>
              {[["0,0,tl"],["0,auto,tr"],["auto,0,bl"],["auto,auto,br"]].map(([t, b, corner]) => (
                <svg key={corner} width="32" height="32" viewBox="0 0 32 32"
                  style={{ position: "absolute", top: t !== "auto" ? 0 : "auto", bottom: b !== "auto" ? 0 : "auto", left: corner.endsWith("l") ? 0 : "auto", right: corner.endsWith("r") ? 0 : "auto" }}>
                  {corner === "tl" && <path d="M2 14 L2 2 L14 2" stroke={T.brand} strokeWidth="2.5" fill="none" strokeLinecap="round"/>}
                  {corner === "tr" && <path d="M18 2 L30 2 L30 14" stroke={T.brand} strokeWidth="2.5" fill="none" strokeLinecap="round"/>}
                  {corner === "bl" && <path d="M2 18 L2 30 L14 30" stroke={T.brand} strokeWidth="2.5" fill="none" strokeLinecap="round"/>}
                  {corner === "br" && <path d="M18 30 L30 30 L30 18" stroke={T.brand} strokeWidth="2.5" fill="none" strokeLinecap="round"/>}
                </svg>
              ))}
              {/* Scanning line */}
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: `${T.brand}90`, transform: "translateY(-50%)", animation: "scanLine 1.8s ease-in-out infinite" }}/>
            </div>
            <style>{`@keyframes scanLine{0%,100%{top:20%}50%{top:80%}}`}</style>
            <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.7)", pointerEvents: "none" }}>
              Point at barcode
            </div>
          </>
        )}
      </div>

      <ManualEntry value={manualInput} onChange={setManualInput} onSubmit={() => { stopCamera(); onDetected(manualInput.trim()); }} onCancel={onCancel} />
    </div>
  );
}

function ManualEntry({ value, onChange, onSubmit, onCancel }) {
  const { T: _T } = { T };
  return (
    <div>
      <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 7, fontFamily: "'DM Mono',monospace" }}>Or enter barcode manually</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, ""))}
          onKeyDown={e => e.key === "Enter" && value.trim() && onSubmit()}
          placeholder="e.g. 0070038642824"
          inputMode="numeric"
          style={{ flex: 1, background: T.s2, border: `1px solid ${T.bd}`, borderRadius: 10, padding: "11px 13px", color: "#fff", fontSize: 15, outline: "none", fontFamily: "'DM Mono',monospace", letterSpacing: 1 }}
        />
        <button
          onClick={onSubmit}
          disabled={value.trim().length < 6}
          style={{ padding: "11px 16px", borderRadius: 10, background: value.trim().length >= 6 ? T.brand : T.bd, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: value.trim().length >= 6 ? "pointer" : "default", fontFamily: "inherit", flexShrink: 0 }}
        >
          Look Up
        </button>
      </div>
      <button onClick={onCancel} style={{ marginTop: 10, background: "none", border: "none", color: T.mu, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>Cancel</button>
    </div>
  );
}
