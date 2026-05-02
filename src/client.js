export { sb } from "./supabase.js";

export async function ai(prompt, max = 900) {
  const r = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: max,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const d = await r.json();
  console.log("[ai] HTTP status:", r.status, "response keys:", Object.keys(d));
  if (!r.ok || d.type === "error") {
    const msg = d.error?.message || d.error || JSON.stringify(d);
    console.error("[ai] API error:", msg);
    throw new Error(msg);
  }
  const text = d.content?.[0]?.text || "";
  if (!text) console.warn("[ai] empty text in response:", JSON.stringify(d).slice(0, 200));
  return text;
}
