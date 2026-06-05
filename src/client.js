export { sb } from "./supabase.js";
import { sb } from "./supabase.js";
import { safetyCheck } from "./utils/safety.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function streamAI(prompt, max = 900, feature = "default", onChunk, onComplete) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`,
  };

  const response = await fetch(`${API_BASE}/api/claude`, {
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
  if (response.status === 429) {
    const d = await response.json().catch(() => ({}));
    window.dispatchEvent(new CustomEvent("cm:daily-limit-reached", { detail: d }));
    throw Object.assign(new Error(d.message || "Daily AI limit reached"), { reason: d.reason, limitDetail: d });
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
  if (!session?.access_token) throw new Error("Not authenticated");
  const body = JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: max,
    feature,
    messages: [{ role: "user", content: prompt }],
  });
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`,
  };
  const _url = `${API_BASE}/api/claude`;
  console.log('[ai] POST', _url, '| feature:', feature, '| max:', max);
  const response = await fetch(_url, { method: "POST", headers, body });
  console.log('[ai] response status:', response.status, '| feature:', feature);
  const text = await response.text();
  console.log('[ai] response body (first 300):', text.slice(0, 300));
  const d = JSON.parse(text);
  if (response.status === 402) {
    window.dispatchEvent(new CustomEvent("cm:subscription-required", { detail: d }));
    throw new Error(d.message || "Subscription required");
  }
  if (response.status === 429) {
    window.dispatchEvent(new CustomEvent("cm:daily-limit-reached", { detail: d }));
    throw Object.assign(new Error(d.message || "Daily AI limit reached"), { reason: d.reason, limitDetail: d });
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

// aiWithTools — forced tool use: passes a tool schema + tool_choice so the model
// MUST return a structured object via the tool_use block. Returns the tool's `input`
// directly (already a valid JS object, no JSON parsing needed).
//
// Root cause of "empty plan" bug: when the server's TOKEN_LIMITS doesn't contain
// the feature key, it falls back to default:{output:400}. With 400 tokens,
// stop_reason="max_tokens" fires immediately and Anthropic returns input:{} (empty).
// Since {} is truthy, the old code returned {} without throwing, leading to 0 days.
// Fix: (1) server now uses max(clientMax, serverLimit) for tool_choice calls so 400
// never truncates; (2) this function throws on empty input or max_tokens truncation.
export async function aiWithTools(prompt, tools, toolName, max = 8000, feature = "default") {
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  const body = JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: max,
    feature,
    tools,
    tool_choice: { type: "tool", name: toolName },
    messages: [{ role: "user", content: prompt }],
  });
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`,
  };
  const response = await fetch(`${API_BASE}/api/claude`, { method: "POST", headers, body });
  const text = await response.text();
  const d = JSON.parse(text);
  if (response.status === 402) {
    window.dispatchEvent(new CustomEvent("cm:subscription-required", { detail: d }));
    throw new Error(d.message || "Subscription required");
  }
  if (response.status === 429) {
    window.dispatchEvent(new CustomEvent("cm:daily-limit-reached", { detail: d }));
    throw Object.assign(new Error(d.message || "Daily AI limit reached"), { reason: d.reason, limitDetail: d });
  }
  if (!response.ok || d.type === "error") {
    throw new Error(d.error?.message || d.error || "AI error");
  }

  // ── Instrument: log exact response shape for meal-prep debugging ─────────
  if (feature && feature.startsWith('meal_prep')) {
    const toolUseBlock = d.content?.find(b => b.type === "tool_use");
    const shape = {
      stop_reason:      d.stop_reason,
      content_types:    d.content?.map(b => b.type),
      tool_use_found:   !!toolUseBlock,
      tool_use_name:    toolUseBlock?.name,
      input_top_keys:   Object.keys(toolUseBlock?.input || {}),
      input_days_count: toolUseBlock?.input?.days?.length ?? null,
      max_tokens_used:  max,
    };
    console.log('[aiWithTools] response shape:', JSON.stringify(shape));
    try {
      await sb.from('error_logs').insert({
        level: 'info', context: 'mealprep_toolshape',
        message: JSON.stringify(shape),
        request_path: feature,
        created_at: new Date().toISOString(),
      });
    } catch (_) { /* non-blocking */ }
  }

  // ── stop_reason guard: max_tokens means output was truncated ────────────
  if (d.stop_reason === 'max_tokens') {
    console.error('[aiWithTools] max_tokens hit — plan truncated. Requested:', max, 'Feature:', feature);
    throw new Error('Plan generation ran out of space — tap Generate to try again');
  }

  const toolUse = d.content?.find(b => b.type === "tool_use" && b.name === toolName);

  // ── empty-input guard: {} is truthy but means the model returned nothing ─
  if (!toolUse || !toolUse.input || Object.keys(toolUse.input).length === 0) {
    console.error("[aiWithTools] missing or empty tool_use block", { stop_reason: d.stop_reason, types: d.content?.map(b => b.type) });
    throw new Error("No structured output returned — tap Generate to try again");
  }
  return toolUse.input;
}

export async function aiWithVision(base64Image, mediaType, textPrompt, max = 900, feature = "default") {
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`,
  };
  const body = JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: max,
    feature,
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: base64Image } },
        { type: "text", text: textPrompt },
      ],
    }],
  });
  const response = await fetch(`${API_BASE}/api/claude`, { method: "POST", headers, body });
  const text = await response.text();
  const d = JSON.parse(text);
  if (response.status === 402) {
    window.dispatchEvent(new CustomEvent("cm:subscription-required", { detail: d }));
    throw new Error(d.message || "Subscription required");
  }
  if (response.status === 429) {
    window.dispatchEvent(new CustomEvent("cm:daily-limit-reached", { detail: d }));
    throw Object.assign(new Error(d.message || "Daily AI limit reached"), { reason: d.reason, limitDetail: d });
  }
  if (!response.ok || d.type === "error") {
    const msg = d.error?.message || d.error || JSON.stringify(d);
    throw new Error(msg);
  }
  return d.content?.[0]?.text || "";
}
