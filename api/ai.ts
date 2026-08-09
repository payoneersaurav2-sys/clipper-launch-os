import { PromptEngine } from '../packages/core/src/ai/prompt-engine';
import type { AIPromptContext, ChatMessage } from '../packages/core/src/ai/types';

export const config = { runtime: 'edge' };
const environment = () => (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

type CreditReservation = { allowed?: boolean; code?: string; reservationId?: string; credits?: number; required?: number; available?: number };

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

type PremiumFeature = 'knowledge_vault' | 'prompt_library';

const operationToPremiumFeature: Record<string, PremiumFeature | null> = {
  knowledge_answer: 'knowledge_vault',
  prompt_library_execution: 'prompt_library',
};

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
      usage: { include: true },
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
  let creditReservationId: string | undefined;
  try {
    const { context } = await request.json() as { context?: AIPromptContext };
    if (!context?.systemPrompt || !context?.developerPrompt || !context?.taskContext?.workspace?.id) return json({ error: 'Invalid AI request.', code: 'PROVIDER_OFFLINE' }, 400);
    const operation = String(context.billingOperation ?? '').slice(0, 64);
    const requiredPremiumFeature = operationToPremiumFeature[operation];
    if (requiredPremiumFeature) {
      try {
        const entitlements = await invokeEntitlementRpc(
          supabaseUrl,
          supabaseAnonKey,
          authorization,
          'current_creator_os_entitlements',
          {},
        );
        if (entitlements?.status !== 'active' || entitlements?.capabilities?.[requiredPremiumFeature] !== true) {
          return json({ error: 'This AI feature requires a Creator subscription to use.', code: 'SUBSCRIPTION_REQUIRED' }, 403);
        }
      } catch {
        return json({ error: 'Creator OS could not verify your plan. Please try again.', code: 'PLAN_NOT_RESOLVED' }, 503);
      }
    }
    let reservation: CreditReservation;
    try {
      reservation = await invokeEntitlementRpc(
        supabaseUrl,
        supabaseAnonKey,
        authorization,
        'reserve_creator_os_credits',
        { p_operation: operation },
      ) as CreditReservation;
    } catch {
      return json({ error: 'Creator OS could not verify your plan. Please try again.', code: 'PLAN_NOT_RESOLVED' }, 503);
    }
    if (!reservation.allowed || !reservation.reservationId) {
      const code = reservation.code === 'INSUFFICIENT_CREDITS'
        ? 'INSUFFICIENT_CREDITS'
        : reservation.code === 'SUBSCRIPTION_REQUIRED'
          ? 'SUBSCRIPTION_REQUIRED'
          : reservation.code === 'CREDIT_OPERATION_UNAVAILABLE'
            ? 'CREDIT_OPERATION_UNAVAILABLE'
          : 'PLAN_NOT_RESOLVED';
      const message = code === 'INSUFFICIENT_CREDITS'
        ? `Not enough CreatorOS credits for this action. It requires ${reservation.required ?? 'more'} credits; you have ${reservation.available ?? 0}.`
        : code === 'SUBSCRIPTION_REQUIRED'
          ? 'Your Creator OS account is not eligible to use AI generation.'
          : code === 'CREDIT_OPERATION_UNAVAILABLE'
            ? 'This AI operation is not available until its credit cost is configured.'
          : 'Your Creator OS plan could not be resolved. Please sign in through Whop again.';
      return json({ error: message, code }, 403);
    }
    creditReservationId = reservation.reservationId;
    const built = PromptEngine.build(PromptEngine.compress(context));
    const maxTokens = Math.min(context.maxTokens ?? 4000, 8000);
    let upstream = await generateFromOpenRouter(openRouterKey, built.model, built.messages, built.temperature, maxTokens, context.expectedJsonSchema);
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => 'OpenRouter rejected the request.');
      await invokeEntitlementRpc(supabaseUrl, supabaseAnonKey, authorization, 'release_creator_os_credit_reservation', { p_reservation_id: creditReservationId }).catch(() => undefined);
      return json({ error: upstream.status === 401 ? 'OpenRouter credentials are invalid or missing.' : detail, code: upstream.status === 401 ? 'AUTH_FAILED' : upstream.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_OFFLINE' }, upstream.status === 401 ? 502 : upstream.status);
    }
    let data = await upstream.json();
    let actualCostUsd = Number(data.usage?.cost ?? 0);
    let content = data.choices?.[0]?.message?.content ?? '';
    let parsed = context.expectedJsonSchema ? parseModelJson(content) : null;
    if (context.expectedJsonSchema && parsed === null) {
      // One real retry is cheaper and safer than inventing or attempting to repair AI output.
      upstream = await generateFromOpenRouter(openRouterKey, built.model, [...built.messages, { role: 'user', content: 'Return the requested result as one valid JSON object only. Do not use markdown fences or explanatory text.' }], built.temperature, maxTokens, context.expectedJsonSchema);
      if (!upstream.ok) {
        await invokeEntitlementRpc(supabaseUrl, supabaseAnonKey, authorization, 'release_creator_os_credit_reservation', { p_reservation_id: creditReservationId }).catch(() => undefined);
        return json({ error: 'OpenRouter could not return a valid structured response.', code: upstream.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_OFFLINE' }, upstream.status);
      }
      data = await upstream.json(); actualCostUsd += Number(data.usage?.cost ?? 0); content = data.choices?.[0]?.message?.content ?? ''; parsed = parseModelJson(content);
      if (parsed === null) {
        await invokeEntitlementRpc(supabaseUrl, supabaseAnonKey, authorization, 'release_creator_os_credit_reservation', { p_reservation_id: creditReservationId }).catch(() => undefined);
        return json({ error: 'AI returned invalid JSON after a retry. Please try again.', code: 'INVALID_JSON' }, 502);
      }
    }
    if (!content) {
      await invokeEntitlementRpc(supabaseUrl, supabaseAnonKey, authorization, 'release_creator_os_credit_reservation', { p_reservation_id: creditReservationId }).catch(() => undefined);
      return json({ error: 'OpenRouter returned an empty response.', code: 'PROVIDER_OFFLINE' }, 502);
    }
    if (parsed !== null) content = JSON.stringify(parsed);
    await invokeEntitlementRpc(supabaseUrl, supabaseAnonKey, authorization, 'complete_creator_os_credit_reservation', {
      p_reservation_id: creditReservationId,
      p_provider_request_id: data.id ?? null,
      p_actual_cost_usd: Number.isFinite(actualCostUsd) ? actualCostUsd : null,
      p_ai_usage_event_id: null,
    }).catch(() => undefined);
    return json({ content, model: built.model, generationId: data.id, latencyMs: 0, usage: { promptTokens: data.usage?.prompt_tokens ?? 0, completionTokens: data.usage?.completion_tokens ?? 0, totalTokens: data.usage?.total_tokens ?? 0 } }, 200);
  } catch {
    if (creditReservationId) {
      await invokeEntitlementRpc(supabaseUrl, supabaseAnonKey, authorization, 'release_creator_os_credit_reservation', { p_reservation_id: creditReservationId }).catch(() => undefined);
    }
    return json({ error: 'AI gateway could not process this request.', code: 'PROVIDER_OFFLINE' }, 500);
  }
}
