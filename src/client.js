export { sb } from "./supabase.js";
import { sb } from "./supabase.js";
import { safetyCheck } from "./utils/safety.js";
import { ensureAIConsent, AIConsentDeclined } from "./services/aiConsent.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function streamAI(prompt, max = 900, feature = "default", onChunk, onComplete) {
  // AI consent gate — matches ai()/aiWithVision(): NO user data reaches Anthropic
  // until the user has explicitly enabled AI. Covers adapt-now, meal-prep, restaurant-AI.
  if (!(await ensureAIConsent())) throw new AIConsentDeclined();
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
  if (!(await ensureAIConsent())) throw new AIConsentDeclined();
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
  const _dev = import.meta.env.MODE !== "production";
  _dev && console.log('[ai] POST', _url, '| feature:', feature, '| max:', max);
  const response = await fetch(_url, { method: "POST", headers, body });
  _dev && console.log('[ai] response status:', response.status, '| feature:', feature);
  const text = await response.text();
  _dev && console.log('[ai] response body (first 300):', text.slice(0, 300));
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
  if (!(await ensureAIConsent())) throw new AIConsentDeclined();
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
  if (!(await ensureAIConsent())) throw new AIConsentDeclined();
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

// aiWithToolsAndVision — forced tool use with a vision (image) message.
// Same guarantees as aiWithTools: model MUST fill the schema, returns toolUse.input
// directly (no JSON parsing), throws on truncation or empty output.
export async function aiWithToolsAndVision(base64Image, mediaType, textPrompt, tools, toolName, max = 2000, feature = "default") {
  if (!(await ensureAIConsent())) throw new AIConsentDeclined();
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  const body = JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: max,
    feature,
    tools,
    tool_choice: { type: "tool", name: toolName },
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: base64Image } },
        { type: "text", text: textPrompt },
      ],
    }],
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
  if (d.stop_reason === 'max_tokens') {
    console.error('[aiWithToolsAndVision] max_tokens hit — truncated. Requested:', max, 'Feature:', feature);
    throw new Error('Could not read menu — tap Scan to try again');
  }
  const toolUse = d.content?.find(b => b.type === "tool_use" && b.name === toolName);
  if (!toolUse || !toolUse.input || Object.keys(toolUse.input).length === 0) {
    console.error("[aiWithToolsAndVision] missing or empty tool_use block", { stop_reason: d.stop_reason });
    throw new Error("No structured output returned — tap Scan to try again");
  }
  return toolUse.input;
}

// aiExtractBodyScan — reads an Evolt360 body-composition scan (photo/screenshot OR PDF)
// via forced tool use. Reuses /api/claude (consent/auth/subscription/limit gated). A PDF
// goes as a `document` block (Claude reads it natively; /api/claude forwards content blocks
// verbatim); an image goes as an `image` block. Returns the structured tool input, which
// includes `recognized` (false when it's NOT an Evolt360 sheet) + `confidence` — the caller
// uses those to show the graceful "couldn't read this as an Evolt360 scan" fallback.
const EVOLT_SCAN_TOOL = {
  name: "evolt_scan",
  description: "Extract body-composition metrics from an Evolt360 body-composition scan sheet.",
  input_schema: {
    type: "object",
    properties: {
      recognized:         { type: "boolean", description: "true ONLY if this is clearly an Evolt360 body-composition scan (a labeled Evolt360 results sheet). false for any other document, a different scanner brand, or an unreadable image." },
      confidence:         { type: "string", enum: ["high", "medium", "low"], description: "Internal reliability rating — not shown to the user." },
      scan_date:          { type: "string", description: "The test/scan date printed on the sheet, formatted YYYY-MM-DD. Omit if not clearly shown." },
      weight_kg:          { type: "number", description: "Body weight in KILOGRAMS (convert if the sheet shows lb)." },
      body_fat_pct:       { type: "number", description: "Body fat percentage (number only)." },
      lean_mass_kg:       { type: "number", description: "Lean Body Mass / Fat-Free Mass, in kg." },
      skeletal_muscle_kg: { type: "number", description: "Skeletal Muscle Mass, in kg." },
      visceral_fat:       { type: "number", description: "Visceral fat rating/level (unitless number)." },
      body_water_pct:     { type: "number", description: "Total Body Water percentage." },
      bone_mass_kg:       { type: "number", description: "Bone mineral content / bone mass, in kg." },
      protein_kg:         { type: "number", description: "Protein mass, in kg." },
      bmr_kcal:           { type: "number", description: "Basal Metabolic Rate, kcal/day." },
      tee_kcal:           { type: "number", description: "Total Energy Expenditure / Active Metabolic Rate, kcal/day." },
      metabolic_age:      { type: "number", description: "Metabolic age in years." },
      notes:              { type: "string", description: "Anything ambiguous or unreadable." },
    },
    required: ["recognized", "confidence"],
  },
};

export async function aiExtractBodyScan(base64, mediaType, max = 1500) {
  if (!(await ensureAIConsent())) throw new AIConsentDeclined();
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  const isPdf = mediaType === "application/pdf";
  const mediaBlock = isPdf
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
    : { type: "image",    source: { type: "base64", media_type: mediaType, data: base64 } };
  const prompt = "This is a user-uploaded Evolt360 body-composition scan — a photo/screenshot or a PDF of the results sheet. Extract the labeled values into the evolt_scan tool. Report all weights in KILOGRAMS (convert from lb if the sheet is imperial). Include the test/scan date printed on the sheet (scan_date, YYYY-MM-DD) if shown. Only fill fields you can actually read; omit anything not clearly present. If this is NOT an Evolt360 body-composition scan sheet, or it's unreadable, set recognized=false and leave the metrics empty.";
  const body = JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: max,
    feature: "body_scan",
    tools: [EVOLT_SCAN_TOOL],
    tool_choice: { type: "tool", name: "evolt_scan" },
    messages: [{ role: "user", content: [mediaBlock, { type: "text", text: prompt }] }],
  });
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` };
  console.log("[bodyscan] send: isPdf=", isPdf, "mediaType=", mediaType, "b64len=", base64?.length ?? 0);
  const response = await fetch(`${API_BASE}/api/claude`, { method: "POST", headers, body });
  const text = await response.text();
  console.log("[bodyscan] /api/claude status=", response.status, "len=", text.length);
  let d; try { d = JSON.parse(text); } catch { throw new Error(`Bad response (status ${response.status}): ${text.slice(0, 140)}`); }
  if (response.status === 402) { window.dispatchEvent(new CustomEvent("cm:subscription-required", { detail: d })); throw new Error(d.message || "Subscription required"); }
  if (response.status === 429) { window.dispatchEvent(new CustomEvent("cm:daily-limit-reached", { detail: d })); throw Object.assign(new Error(d.message || "Daily AI limit reached"), { reason: d.reason, limitDetail: d }); }
  if (!response.ok || d.type === "error") {
    // A PDF the proxy/model can't accept surfaces here → the status + message reveal it.
    console.error("[bodyscan] API error:", response.status, d);
    throw new Error(`API ${response.status}: ${String(d.error?.message || d.error || "error").slice(0, 160)}`);
  }
  const toolUse = d.content?.find(b => b.type === "tool_use" && b.name === "evolt_scan");
  if (!toolUse?.input) {
    console.error("[bodyscan] no tool_use block. stop_reason=", d.stop_reason, "blocks=", d.content?.map(b => b.type));
    throw new Error(`No structured output (stop=${d.stop_reason || "?"})`);
  }
  console.log("[bodyscan] extracted:", JSON.stringify(toolUse.input));
  return toolUse.input;
}
