import { PromptEngine } from '../packages/core/src/ai/prompt-engine';
import type { AIPromptContext, ChatMessage } from '../packages/core/src/ai/types';

export const config = { runtime: 'edge' };
const environment = () => (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

type Reservation = { allowed?: boolean; code?: string; eventId?: string; maxOutputTokens?: number };

async function invokeEntitlementRpc(
  supabaseUrl: string,
  supabaseAnonKey: string,
  authorization: string,
  functionName: string,
  args: Record<string, unknown>,
) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      authorization,
      'content-type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!response.ok) throw new Error(`Entitlement service failed: ${response.status}`);
  return response.json();
}

function parseModelJson(content: string): unknown | null {
  const trimmed = content.trim();
  const candidates = [
    trimmed,
    trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''),
    trimmed.slice(Math.max(0, trimmed.indexOf('{')), trimmed.lastIndexOf('}') + 1),
  ];
  for (const candidate of candidates) {
    if (!candidate || candidate === '}') continue;
    try { return JSON.parse(candidate); } catch { /* Try the next valid JSON envelope. */ }
  }
  return null;
}

async function generateFromOpenRouter(key: string, model: string, messages: ChatMessage[], temperature: number, maxTokens: number | undefined, expectedSchema: AIPromptContext['expectedJsonSchema']) {
  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://creator-os999.vercel.app', 'X-Title': 'Creator OS' },
    body: JSON.stringify({
      model, messages, temperature, max_tokens: maxTokens,
      response_format: expectedSchema ? { type: 'json_schema', json_schema: { name: 'creator_os_response', strict: false, schema: expectedSchema } } : undefined,
      plugins: expectedSchema ? [{ id: 'response-healing' }] : undefined,
    }),
  });
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const env = environment();
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  const openRouterKey = env.OPENROUTER_API_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !openRouterKey) return json({ error: 'AI gateway is not configured.', code: 'AUTH_FAILED' }, 503);
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Sign in again to use AI generation.', code: 'AUTH_FAILED' }, 401);
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: supabaseAnonKey, authorization } });
  if (!userResponse.ok) return json({ error: 'Sign in again to use AI generation.', code: 'AUTH_FAILED' }, 401);
  let reservationId: string | undefined;
  try {
    const { context } = await request.json() as { context?: AIPromptContext };
    if (!context?.systemPrompt || !context?.developerPrompt || !context?.taskContext?.workspace?.id) return json({ error: 'Invalid AI request.', code: 'PROVIDER_OFFLINE' }, 400);
    const operation = String(context.taskContext.workflowStage ?? 'custom').slice(0, 64);
    let reservation: Reservation;
    try {
      reservation = await invokeEntitlementRpc(
        supabaseUrl,
        supabaseAnonKey,
        authorization,
        'reserve_ai_generation',
        { p_operation: operation },
      ) as Reservation;
    } catch {
      return json({ error: 'Creator OS could not verify your plan. Please try again.', code: 'PLAN_NOT_RESOLVED' }, 503);
    }
    if (!reservation.allowed || !reservation.eventId) {
      const code = reservation.code === 'PLAN_LIMIT_REACHED'
        ? 'PLAN_LIMIT_REACHED'
        : reservation.code === 'SUBSCRIPTION_REQUIRED'
          ? 'SUBSCRIPTION_REQUIRED'
          : 'PLAN_NOT_RESOLVED';
      const message = code === 'PLAN_LIMIT_REACHED'
        ? 'You have reached this month\'s AI workflow capacity. Upgrade for more generation capacity.'
        : code === 'SUBSCRIPTION_REQUIRED'
          ? 'An active Creator OS subscription is required to use AI generation.'
          : 'Your Creator OS plan could not be resolved. Please sign in through Whop again.';
      return json({ error: message, code }, 403);
    }
    reservationId = reservation.eventId;
    const built = PromptEngine.build(PromptEngine.compress(context));
    const maxTokens = Math.min(context.maxTokens ?? reservation.maxOutputTokens ?? 4000, reservation.maxOutputTokens ?? 4000);
    let upstream = await generateFromOpenRouter(openRouterKey, built.model, built.messages, built.temperature, maxTokens, context.expectedJsonSchema);
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => 'OpenRouter rejected the request.');
      await invokeEntitlementRpc(supabaseUrl, supabaseAnonKey, authorization, 'release_ai_generation', { p_event_id: reservationId }).catch(() => undefined);
      return json({ error: upstream.status === 401 ? 'OpenRouter credentials are invalid or missing.' : detail, code: upstream.status === 401 ? 'AUTH_FAILED' : upstream.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_OFFLINE' }, upstream.status === 401 ? 502 : upstream.status);
    }
    let data = await upstream.json();
    let content = data.choices?.[0]?.message?.content ?? '';
    let parsed = context.expectedJsonSchema ? parseModelJson(content) : null;
    if (context.expectedJsonSchema && parsed === null) {
      // One real retry is cheaper and safer than inventing or attempting to repair AI output.
      upstream = await generateFromOpenRouter(openRouterKey, built.model, [...built.messages, { role: 'user', content: 'Return the requested result as one valid JSON object only. Do not use markdown fences or explanatory text.' }], built.temperature, maxTokens, context.expectedJsonSchema);
      if (!upstream.ok) {
        await invokeEntitlementRpc(supabaseUrl, supabaseAnonKey, authorization, 'release_ai_generation', { p_event_id: reservationId }).catch(() => undefined);
        return json({ error: 'OpenRouter could not return a valid structured response.', code: upstream.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_OFFLINE' }, upstream.status);
      }
      data = await upstream.json(); content = data.choices?.[0]?.message?.content ?? ''; parsed = parseModelJson(content);
      if (parsed === null) return json({ error: 'AI returned invalid JSON after a retry. Please try again.', code: 'INVALID_JSON' }, 502);
    }
    if (!content) {
      await invokeEntitlementRpc(supabaseUrl, supabaseAnonKey, authorization, 'release_ai_generation', { p_event_id: reservationId }).catch(() => undefined);
      return json({ error: 'OpenRouter returned an empty response.', code: 'PROVIDER_OFFLINE' }, 502);
    }
    if (parsed !== null) content = JSON.stringify(parsed);
    await invokeEntitlementRpc(supabaseUrl, supabaseAnonKey, authorization, 'complete_ai_generation', {
      p_event_id: reservationId,
      p_provider_request_id: data.id ?? null,
      p_prompt_tokens: data.usage?.prompt_tokens ?? 0,
      p_completion_tokens: data.usage?.completion_tokens ?? 0,
      p_total_tokens: data.usage?.total_tokens ?? 0,
    }).catch(() => undefined);
    return json({ content, model: built.model, generationId: data.id, latencyMs: 0, usage: { promptTokens: data.usage?.prompt_tokens ?? 0, completionTokens: data.usage?.completion_tokens ?? 0, totalTokens: data.usage?.total_tokens ?? 0 } }, 200);
  } catch {
    if (reservationId) {
      await invokeEntitlementRpc(supabaseUrl, supabaseAnonKey, authorization, 'release_ai_generation', { p_event_id: reservationId }).catch(() => undefined);
    }
    return json({ error: 'AI gateway could not process this request.', code: 'PROVIDER_OFFLINE' }, 500);
  }
}
