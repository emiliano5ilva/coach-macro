import { useState } from "react";
import { sb } from "./client.js";
import { T } from "./components.jsx";

const REASONS = [
  "Unsafe recommendation",
  "Medically inaccurate",
  "Inappropriate for my health condition",
  "Other concern",
];

export function FlagBtn({ responseText, feature, user, style = {} }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!reason) return;
    setLoading(true);
    try {
      await sb.from("flagged_responses").insert({
        user_id: user?.id || null,
        response_text: (responseText || "").slice(0, 2000),
        flag_reason: reason,
        feature: feature || "unknown",
      });
    } catch {}
    setLoading(false);
    setSubmitted(true);
    setTimeout(() => { setOpen(false); setSubmitted(false); setReason(""); }, 3000);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Flag this AI response"
        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: "rgba(245,245,240,.25)", fontSize: 12, lineHeight: 1, ...style }}>
        🚩
      </button>
      {open && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 2000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setOpen(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: T.s2, borderRadius: "16px 16px 0 0", padding: "24px 20px 36px", width: "100%", maxWidth: 480, boxSizing: "border-box" }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Flag AI Response</div>
            <div style={{ fontSize: 13, color: T.mu, marginBottom: 16, lineHeight: 1.55 }}>Help us improve safety. What's your concern?</div>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#34D399", marginBottom: 8 }}>Reported — thank you.</div>
                <div style={{ fontSize: 12, color: T.mu, lineHeight: 1.65 }}>
                  For health or safety concerns, consider consulting a qualified professional.{" "}
                  <a href="https://coach-macro.com/support" style={{ color: "#2979FF", textDecoration: "none" }}>
                    coach-macro.com/support →
                  </a>
                </div>
              </div>
            ) : (
              <>
                {REASONS.map(r => (
                  <div key={r} onClick={() => setReason(r)}
                    style={{ padding: "12px 14px", marginBottom: 8, borderRadius: 10, border: `1.5px solid ${reason === r ? T.prot : T.bd}`, background: reason === r ? `${T.prot}10` : T.s3, cursor: "pointer", fontSize: 13 }}>
                    {r}
                  </div>
                ))}
                <button
                  onClick={submit}
                  disabled={!reason || loading}
                  style={{ width: "100%", padding: 13, marginTop: 8, background: reason && !loading ? T.prot : "rgba(255,255,255,.08)", color: reason && !loading ? "#000" : T.mu, borderRadius: 10, border: "none", fontSize: 14, fontWeight: 700, cursor: reason && !loading ? "pointer" : "default", fontFamily: "inherit", transition: "background .2s" }}>
                  {loading ? "Submitting…" : "Submit Report"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
