import React, { useEffect, useRef, useState, useCallback } from "react";
import { T } from "./components.jsx";

// ── Platform detection ────────────────────────────────────────────────────────

const isNative = () =>
  typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.() === true;

const hasBarcodeDetector = () =>
  typeof window !== "undefined" && "BarcodeDetector" in window;

// ── Shared sub-components ─────────────────────────────────────────────────────

function ManualEntry({ value, onChange, onSubmit, onCancel }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 7, fontFamily: "'DM Mono',monospace" }}>
        Or enter barcode manually
      </div>
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
      <button onClick={onCancel} style={{ marginTop: 10, background: "none", border: "none", color: T.mu, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
        Cancel
      </button>
    </div>
  );
}

function DeniedCard({ onCancel }) {
  const [manual, setManual] = useState("");
  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 14, padding: "18px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#f87171" }}>Camera access denied</div>
        <div style={{ fontSize: 12, color: T.mu, lineHeight: 1.55, marginBottom: 10 }}>
          To scan barcodes, allow camera access in:<br />
          <strong style={{ color: "#fff" }}>Settings → Coach Macro → Camera → Allow</strong>
        </div>
        <button
          onClick={() => { window.Capacitor?.Plugins?.App?.openUrl?.({ url: "app-settings:" }); }}
          style={{ padding: "8px 16px", borderRadius: 20, background: "rgba(239,68,68,.2)", border: "1px solid rgba(239,68,68,.4)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
        >
          Open Settings
        </button>
      </div>
      <ManualEntry value={manual} onChange={setManual} onSubmit={() => manual.trim() && onCancel(manual.trim())} onCancel={() => onCancel(null)} />
    </div>
  );
}

// ── Native scanner overlay (iOS / Android via Capacitor plugin) ───────────────
//
// The @capacitor-community/barcode-scanner plugin renders the native camera
// *behind* the WKWebView by making the WebView background transparent.
// We paint a full-screen fixed overlay over everything so the scanning UI
// (corner brackets, cancel button) appears on top of the camera feed.

function makeTransparent() {
  document.documentElement.style.setProperty("background", "transparent", "important");
  document.body.style.setProperty("background", "transparent", "important");
  const root = document.getElementById("root");
  if (root) root.style.setProperty("background", "transparent", "important");
}

function restoreBackground() {
  document.documentElement.style.removeProperty("background");
  document.body.style.removeProperty("background");
  const root = document.getElementById("root");
  if (root) root.style.removeProperty("background");
}

function NativeScanner({ onDetected, onCancel }) {
  // phase: "starting" | "scanning" | "denied"
  const [phase, setPhase] = useState("starting");
  const activeRef = useRef(true);
  const pluginRef = useRef(null);

  async function cleanup() {
    restoreBackground();
    const Scanner = pluginRef.current;
    if (!Scanner) return;
    try { await Scanner.stopScan(); } catch {}
    try { await Scanner.showBackground(); } catch {}
  }

  function handleCancel() {
    activeRef.current = false;
    cleanup().finally(() => onCancel());
  }

  useEffect(() => {
    async function startNative() {
      let Scanner;
      try {
        const mod = await import("@capacitor-community/barcode-scanner");
        Scanner = mod.BarcodeScanner;
        pluginRef.current = Scanner;
      } catch (e) {
        console.error("[NativeScanner] plugin import failed:", e);
        if (activeRef.current) setPhase("denied");
        return;
      }

      // Request camera permission (shows system dialog if needed)
      let status;
      try {
        status = await Scanner.checkPermission({ force: true });
      } catch {
        if (activeRef.current) setPhase("denied");
        return;
      }

      if (!activeRef.current) return;
      if (!status.granted) { setPhase("denied"); return; }

      // Make WebView transparent so native camera shows through
      makeTransparent();
      try { await Scanner.hideBackground(); } catch {}

      if (!activeRef.current) { cleanup(); return; }
      setPhase("scanning");

      // startScan() blocks until a barcode is found or stopScan() is called
      let result;
      try {
        result = await Scanner.startScan({
          targetedFormats: ["EAN_13", "EAN_8", "UPC_A", "UPC_E", "CODE_128", "CODE_39"],
        });
      } catch {
        if (activeRef.current) { cleanup(); onCancel(); }
        return;
      }

      if (!activeRef.current) { cleanup(); return; }
      await cleanup();

      if (result?.hasContent) {
        onDetected(result.content);
      }
    }

    startNative();

    return () => {
      activeRef.current = false;
      cleanup();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === "denied") {
    return (
      <DeniedCard
        onCancel={(val) => {
          if (val) onDetected(val);
          else onCancel();
        }}
      />
    );
  }

  // Transparent fixed overlay — native camera renders through the WebView below
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "transparent", pointerEvents: "auto" }}>
      <style>{`@keyframes nativeScanLine{0%,100%{top:20%}50%{top:80%}}`}</style>

      {phase === "starting" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)" }}>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>Starting camera…</div>
        </div>
      )}

      {phase === "scanning" && (
        <>
          {/* Darkened areas outside the scan zone */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", WebkitMaskImage: "url(#scan-cutout)" }} />

          {/* Scan window — corner brackets */}
          <div style={{ position: "absolute", top: "28%", left: "10%", right: "10%", bottom: "28%", pointerEvents: "none" }}>
            {/* TL */}
            <svg width="44" height="44" viewBox="0 0 44 44" style={{ position: "absolute", top: -2, left: -2 }}>
              <path d="M3 22 L3 3 L22 3" stroke={T.brand} strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
            {/* TR */}
            <svg width="44" height="44" viewBox="0 0 44 44" style={{ position: "absolute", top: -2, right: -2 }}>
              <path d="M22 3 L41 3 L41 22" stroke={T.brand} strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
            {/* BL */}
            <svg width="44" height="44" viewBox="0 0 44 44" style={{ position: "absolute", bottom: -2, left: -2 }}>
              <path d="M3 22 L3 41 L22 41" stroke={T.brand} strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
            {/* BR */}
            <svg width="44" height="44" viewBox="0 0 44 44" style={{ position: "absolute", bottom: -2, right: -2 }}>
              <path d="M22 41 L41 41 L41 22" stroke={T.brand} strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
            {/* Animated scan line */}
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: `${T.brand}cc`, borderRadius: 1, transform: "translateY(-50%)", animation: "nativeScanLine 1.8s ease-in-out infinite" }} />
          </div>

          <div style={{ position: "absolute", bottom: "22%", left: 0, right: 0, textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.8)", letterSpacing: "0.04em" }}>
            Point at barcode
          </div>
        </>
      )}

      {/* Cancel button — always visible */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "52px 20px 12px", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleCancel}
          style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 20, padding: "9px 18px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", WebkitTapHighlightColor: "transparent" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Web scanner (BarcodeDetector API — Chrome / Edge / Android WebView) ───────

function WebScanner({ onDetected, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const [phase, setPhase] = useState("init"); // init | scanning | denied
  const [manualInput, setManualInput] = useState("");

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        detectorRef.current = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
        });
      } catch {
        if (active) setPhase("denied");
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
          setPhase("denied");
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
    return () => { active = false; stopCamera(); };
  }, [onDetected, stopCamera]);

  if (phase === "denied") {
    return (
      <div style={{ padding: "20px 0" }}>
        <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 14, padding: "18px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#f87171" }}>Camera access denied</div>
          <div style={{ fontSize: 12, color: T.mu, lineHeight: 1.55, marginBottom: 10 }}>
            To scan barcodes, allow camera access in your browser settings.
          </div>
        </div>
        <ManualEntry value={manualInput} onChange={setManualInput} onSubmit={() => { stopCamera(); onDetected(manualInput.trim()); }} onCancel={onCancel} />
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
            <div style={{ position: "absolute", inset: "20%", pointerEvents: "none" }}>
              {[["0,0,tl"], ["0,auto,tr"], ["auto,0,bl"], ["auto,auto,br"]].map(([t, b, corner]) => (
                <svg key={corner} width="32" height="32" viewBox="0 0 32 32"
                  style={{ position: "absolute", top: t !== "auto" ? 0 : "auto", bottom: b !== "auto" ? 0 : "auto", left: corner.endsWith("l") ? 0 : "auto", right: corner.endsWith("r") ? 0 : "auto" }}>
                  {corner === "tl" && <path d="M2 14 L2 2 L14 2" stroke={T.brand} strokeWidth="2.5" fill="none" strokeLinecap="round" />}
                  {corner === "tr" && <path d="M18 2 L30 2 L30 14" stroke={T.brand} strokeWidth="2.5" fill="none" strokeLinecap="round" />}
                  {corner === "bl" && <path d="M2 18 L2 30 L14 30" stroke={T.brand} strokeWidth="2.5" fill="none" strokeLinecap="round" />}
                  {corner === "br" && <path d="M18 30 L30 30 L30 18" stroke={T.brand} strokeWidth="2.5" fill="none" strokeLinecap="round" />}
                </svg>
              ))}
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: `${T.brand}90`, transform: "translateY(-50%)", animation: "scanLine 1.8s ease-in-out infinite" }} />
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

// ── Root component — picks the right scanner for the platform ─────────────────
//
//  1. Native Capacitor (iOS / Android): NativeScanner via plugin
//  2. Web with BarcodeDetector (Chrome / Edge / Android Chrome): WebScanner
//  3. Everything else (Safari, Firefox, older browsers): ManualEntry

export default function BarcodeScanner({ onDetected, onCancel }) {
  const [manualInput, setManualInput] = useState("");

  if (isNative()) {
    return <NativeScanner onDetected={onDetected} onCancel={onCancel} />;
  }

  if (hasBarcodeDetector()) {
    return <WebScanner onDetected={onDetected} onCancel={onCancel} />;
  }

  // Final fallback: manual barcode entry
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
