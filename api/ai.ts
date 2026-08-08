import { PromptEngine } from '../packages/core/src/ai/prompt-engine';
import type { AIPromptContext, ChatMessage } from '../packages/core/src/ai/types';

export const config = { runtime: 'edge' };
const environment = () => (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

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

async function generateFromOpenRouter(key: string, model: string, messages: ChatMessage[], temperature: number, maxTokens: number | undefined, expectsJson: boolean) {
  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://creator-os999.vercel.app', 'X-Title': 'Creator OS' },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, response_format: expectsJson ? { type: 'json_object' } : undefined }),
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
  try {
    const { context } = await request.json() as { context?: AIPromptContext };
    if (!context?.systemPrompt || !context?.developerPrompt || !context?.taskContext?.workspace?.id) return json({ error: 'Invalid AI request.', code: 'PROVIDER_OFFLINE' }, 400);
    const built = PromptEngine.build(PromptEngine.compress(context));
    let upstream = await generateFromOpenRouter(openRouterKey, built.model, built.messages, built.temperature, context.maxTokens, Boolean(context.expectedJsonSchema));
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => 'OpenRouter rejected the request.');
      return json({ error: upstream.status === 401 ? 'OpenRouter credentials are invalid or missing.' : detail, code: upstream.status === 401 ? 'AUTH_FAILED' : upstream.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_OFFLINE' }, upstream.status === 401 ? 502 : upstream.status);
    }
    let data = await upstream.json();
    let content = data.choices?.[0]?.message?.content ?? '';
    let parsed = context.expectedJsonSchema ? parseModelJson(content) : null;
    if (context.expectedJsonSchema && parsed === null) {
      // One real retry is cheaper and safer than inventing or attempting to repair AI output.
      upstream = await generateFromOpenRouter(openRouterKey, built.model, [...built.messages, { role: 'user', content: 'Return the requested result as one valid JSON object only. Do not use markdown fences or explanatory text.' }], built.temperature, context.maxTokens, true);
      if (!upstream.ok) return json({ error: 'OpenRouter could not return a valid structured response.', code: upstream.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_OFFLINE' }, upstream.status);
      data = await upstream.json(); content = data.choices?.[0]?.message?.content ?? ''; parsed = parseModelJson(content);
      if (parsed === null) return json({ error: 'AI returned invalid JSON after a retry. Please try again.', code: 'INVALID_JSON' }, 502);
    }
    if (!content) return json({ error: 'OpenRouter returned an empty response.', code: 'PROVIDER_OFFLINE' }, 502);
    if (parsed !== null) content = JSON.stringify(parsed);
    return json({ content, model: built.model, generationId: data.id, latencyMs: 0, usage: { promptTokens: data.usage?.prompt_tokens ?? 0, completionTokens: data.usage?.completion_tokens ?? 0, totalTokens: data.usage?.total_tokens ?? 0 } }, 200);
  } catch { return json({ error: 'AI gateway could not process this request.', code: 'PROVIDER_OFFLINE' }, 500); }
}
