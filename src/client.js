export { sb } from "./supabase.js";
import { sb } from "./supabase.js";
import { safetyCheck } from "./utils/safety.js";

export async function streamAI(prompt, max = 900, feature = "default", onChunk, onComplete) {
  const { data: { session } } = await sb.auth.getSession();
  const headers = { "Content-Type": "application/json" };
  if (session?.user?.id) headers["x-user-id"] = session.user.id;

  const response = await fetch("/api/claude", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: max,
      feature,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (response.status === 402) {
    const d = await response.json();
    window.dispatchEvent(new CustomEvent("cm:subscription-required", { detail: d }));
    throw new Error(d.message || "Subscription required");
  }
  if (!response.ok) {
    const d = await response.json().catch(() => ({}));
    throw new Error(d.error || "AI error");
  }

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let buf      = '';
  let fullText = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') { onComplete(fullText); return; }
      let parsed;
      try { parsed = JSON.parse(data); } catch { continue; }
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.text) { fullText += parsed.text; onChunk(fullText); }
    }
  }
  onComplete(fullText);
}

export async function ai(prompt, max = 900, feature = "default") {
  const { data: { session } } = await sb.auth.getSession();
  const body = JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: max,
    feature,
    messages: [{ role: "user", content: prompt }],
  });
  const headers = { "Content-Type": "application/json" };
  if (session?.user?.id) headers["x-user-id"] = session.user.id;
  const response = await fetch("/api/claude", {
    method: "POST",
    headers,
    body,
  });
  const text = await response.text();
  const d = JSON.parse(text);
  if (response.status === 402) {
    window.dispatchEvent(new CustomEvent("cm:subscription-required", { detail: d }));
    throw new Error(d.message || "Subscription required");
  }
  if (!response.ok || d.type === "error") {
    const msg = d.error?.message || d.error || JSON.stringify(d);
    console.error("[ai] API error:", msg);
    throw new Error(msg);
  }
  const result = d.content?.[0]?.text || "";
  if (!result) console.warn("[ai] empty text in response:", text.slice(0, 200));
  return safetyCheck(result);
}
