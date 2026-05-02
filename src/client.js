export { sb } from "./supabase.js";

export async function ai(prompt, max = 900) {
  const body = JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: max,
    messages: [{ role: "user", content: prompt }],
  });
  console.log('Calling /api/claude with:', body.slice(0, 200));
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  console.log('Response status:', response.status);
  const text = await response.text();
  console.log('Raw response:', text.slice(0, 300));
  const d = JSON.parse(text);
  if (!response.ok || d.type === "error") {
    const msg = d.error?.message || d.error || JSON.stringify(d);
    console.error("[ai] API error:", msg);
    throw new Error(msg);
  }
  const result = d.content?.[0]?.text || "";
  if (!result) console.warn("[ai] empty text in response:", text.slice(0, 200));
  return result;
}
