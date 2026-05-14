import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from './admin-verify.js';
import Anthropic from '@anthropic-ai/sdk';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY;

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-6';

const send = (res, data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

async function pipeStream(stream, res) {
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      send(res, { text: chunk.delta.text });
    }
  }
}

export default async function handler(req, res) {
  const session = await verifyAdminSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { agent } = req.query;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    switch (agent) {
      case 'ceo':       await runCEOAgent(res);               break;
      case 'churn':     await runChurnAgent(res);             break;
      case 'financial': await runFinancialAgent(res);         break;
      case 'growth':    await runGrowthAgent(res);            break;
      case 'content':   await runContentAgent(res, req.body); break;
      default:          send(res, { error: 'Unknown agent' });
    }
  } catch (err) {
    send(res, { error: err.message });
  }

  res.end();
}

// ── CEO ADVISOR ───────────────────────────────────────────────────────────────
async function runCEOAgent(res) {
  const now           = new Date();
  const sevenDaysAgo  = new Date(now - 7  * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const oneDayAgo     = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const thisMonth     = now.toISOString().slice(0, 7);

  const [
    totalUsers, proUsers, activeThirty, newThisWeek,
    churnedThisMonth, tokenUsage, errorCount, topFeatures,
  ] = await Promise.all([
    sb.from('profiles').select('*', { count: 'exact', head: true }),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true),
    sb.from('analytics_events').select('user_id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    sb.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    sb.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event', 'subscription.cancel').gte('created_at', thirtyDaysAgo),
    sb.from('token_usage').select('tokens_used').eq('month', thisMonth),
    sb.from('error_logs').select('*', { count: 'exact', head: true }).eq('level', 'error').gte('created_at', oneDayAgo),
    sb.from('analytics_events').select('event').gte('created_at', sevenDaysAgo),
  ]);

  const totalTokens = tokenUsage.data?.reduce((s, r) => s + (r.tokens_used || 0), 0) || 0;
  const mrr    = (proUsers.count || 0) * 2.99;
  const aiCost = (totalTokens / 1_000_000) * 9;

  const featureCounts = {};
  topFeatures.data?.forEach(e => { featureCounts[e.event] = (featureCounts[e.event] || 0) + 1; });

  const data = {
    mrr:              mrr.toFixed(2),
    totalUsers:       totalUsers.count       || 0,
    proUsers:         proUsers.count         || 0,
    activeThirty:     activeThirty.count     || 0,
    newThisWeek:      newThisWeek.count      || 0,
    churnedThisMonth: churnedThisMonth.count || 0,
    aiCostThisMonth:  aiCost.toFixed(2),
    netProfit:        (mrr - aiCost - 1.50).toFixed(2),
    errorsLast24h:    errorCount.count       || 0,
    topFeatures:      Object.entries(featureCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
  };

  send(res, { meta: data });

  const stream = anthropic.messages.stream({
    model: MODEL, max_tokens: 1000,
    messages: [{ role: 'user', content:
      `You are a world-class startup CEO advisor analyzing Coach Macro, a fitness app ($2.99/month Pro). Here is this week's live business data:\n\n${JSON.stringify(data, null, 2)}\n\nProvide a concise CEO briefing:\n1. What's working well (specific numbers)\n2. What needs immediate attention\n3. Top 3 actionable recommendations for this week\n4. One bold growth idea\n\nBe direct. Use actual numbers. No fluff. Max 300 words.`
    }],
  });
  await pipeStream(stream, res);
}

// ── CHURN PREVENTION ──────────────────────────────────────────────────────────
async function runChurnAgent(res) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [allProRes, recentActivityRes] = await Promise.all([
    sb.from('profiles').select('id, is_pro, created_at').eq('is_pro', true),
    sb.from('analytics_events').select('user_id').gte('created_at', sevenDaysAgo),
  ]);

  const activeIds   = new Set(recentActivityRes.data?.map(e => e.user_id) || []);
  const atRisk      = (allProRes.data || []).filter(u => !activeIds.has(u.id));
  const revenueAtRisk = atRisk.length * 2.99;

  send(res, { meta: { atRiskCount: atRisk.length, revenueAtRisk, totalPro: allProRes.data?.length || 0 } });

  const stream = anthropic.messages.stream({
    model: MODEL, max_tokens: 600,
    messages: [{ role: 'user', content:
      `You are a customer success expert for Coach Macro fitness app ($2.99/month).\n\nAt-risk data:\n- ${atRisk.length} Pro users haven't logged in for 7+ days\n- Revenue at risk: $${revenueAtRisk.toFixed(2)}/month\n- Total Pro users: ${allProRes.data?.length || 0}\n\nProvide:\n1. Why users likely went inactive (3 most common reasons for fitness apps)\n2. Specific re-engagement email subject line\n3. Email body (3 sentences, personalized feel)\n4. One in-app notification message\n5. Best time to send (day and time)\n\nBe specific and actionable. Max 200 words.`
    }],
  });
  await pipeStream(stream, res);
}

// ── FINANCIAL ADVISOR ─────────────────────────────────────────────────────────
async function runFinancialAgent(res) {
  const thisMonth = new Date().toISOString().slice(0, 7);

  const [tokenDataRes, proCountRes] = await Promise.all([
    sb.from('token_usage').select('tokens_used, user_id, last_feature').eq('month', thisMonth).order('tokens_used', { ascending: false }),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true),
  ]);

  const totalTokens  = tokenDataRes.data?.reduce((s, r) => s + (r.tokens_used || 0), 0) || 0;
  const proCount     = proCountRes.count || 0;
  const aiCost       = (totalTokens / 1_000_000) * 9;
  const mrr          = proCount * 2.99;
  const top3         = tokenDataRes.data?.slice(0, 3) || [];
  const heavyShare   = totalTokens > 0 ? (top3.reduce((s, u) => s + u.tokens_used, 0) / totalTokens * 100) : 0;

  const data = {
    mrr:               mrr.toFixed(2),
    aiCost:            aiCost.toFixed(2),
    fixedCosts:        '1.50',
    totalCosts:        (aiCost + 1.5).toFixed(2),
    netProfit:         (mrr - aiCost - 1.5).toFixed(2),
    margin:            mrr > 0 ? (((mrr - aiCost - 1.5) / mrr) * 100).toFixed(1) : '0',
    costPerUser:       proCount > 0 ? (aiCost / proCount).toFixed(3) : '0',
    heavyUserTokenShare: heavyShare.toFixed(1),
    totalTokensM:      (totalTokens / 1_000_000).toFixed(3),
  };

  send(res, { meta: data });

  const stream = anthropic.messages.stream({
    model: MODEL, max_tokens: 600,
    messages: [{ role: 'user', content:
      `You are a startup CFO advisor for Coach Macro fitness app.\n\nThis month's financials:\n${JSON.stringify(data, null, 2)}\n\nProvide:\n1. Financial health assessment (1 sentence)\n2. Biggest cost risk and mitigation\n3. Revenue growth lever with highest ROI\n4. When to upgrade infrastructure\n5. Pricing recommendation (keep/raise/bundle)\n\nBe direct with numbers. Max 200 words.`
    }],
  });
  await pipeStream(stream, res);
}

// ── GROWTH ADVISOR ────────────────────────────────────────────────────────────
async function runGrowthAgent(res) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [sourcesRes, referralsRes, totalRes, convertedRes] = await Promise.all([
    sb.from('analytics_events').select('properties').eq('event', 'user.signup').gte('created_at', thirtyDaysAgo),
    sb.from('referrals').select('*').gte('created_at', thirtyDaysAgo),
    sb.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true).gte('created_at', thirtyDaysAgo),
  ]);

  const totalSignups = totalRes.count    || 0;
  const converted    = convertedRes.count || 0;
  const sources = {};
  sourcesRes.data?.forEach(e => {
    const src = e.properties?.source || 'direct';
    sources[src] = (sources[src] || 0) + 1;
  });

  const data = {
    newSignups30days:       totalSignups,
    convertedToPro:         converted,
    conversionRate:         totalSignups ? ((converted / totalSignups) * 100).toFixed(1) : 0,
    referralSignups:        referralsRes.data?.length || 0,
    referralConversionRate: totalSignups && referralsRes.data?.length
      ? ((referralsRes.data.length / totalSignups) * 100).toFixed(1) : 0,
    signupSources: sources,
  };

  send(res, { meta: data });

  const stream = anthropic.messages.stream({
    model: MODEL, max_tokens: 700,
    messages: [{ role: 'user', content:
      `You are a growth advisor for Coach Macro, a fitness app ($2.99/month).\n\n30-day growth data:\n${JSON.stringify(data, null, 2)}\n\nProvide:\n1. Conversion rate assessment (good/needs work + why)\n2. Highest ROI growth channel right now\n3. One viral growth mechanic to implement\n4. Referral program optimization\n5. Content marketing angle that resonates with fitness app users\n\nBe specific. No generic advice. Max 250 words.`
    }],
  });
  await pipeStream(stream, res);
}

// ── CONTENT AGENT ─────────────────────────────────────────────────────────────
async function runContentAgent(res, body) {
  const { competitorImages = [], competitorUsername } = body || {};

  const stream = anthropic.messages.stream({
    model: MODEL, max_tokens: 1000,
    messages: [{
      role: 'user',
      content: [
        ...competitorImages.map(img => ({
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: img },
        })),
        {
          type: 'text',
          text: `Analyze this competitor content from ${competitorUsername || 'a fitness brand'}.\n\nGenerate 3 Coach Macro content ideas that capture the same energy. Coach Macro is a fitness app with dynamic macros, AI coaching, and programs for lifting, running, and Hyrox.\n\nFor each idea:\n1. Content concept (1 sentence)\n2. Hook (first 3 seconds)\n3. Caption (ready to post)\n4. Higgsfield video prompt (detailed, cinematic)\n5. Best platform and posting time\n\nFormat each idea clearly numbered. Make the hooks scroll-stopping.`,
        },
      ],
    }],
  });
  await pipeStream(stream, res);
}
