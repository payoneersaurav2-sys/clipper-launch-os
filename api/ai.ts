import { PromptEngine } from '../packages/core/src/ai/prompt-engine';
import type { AIPromptContext } from '../packages/core/src/ai/types';

export const config = { runtime: 'edge' };
const environment = () => (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

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
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${openRouterKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://creator-os999.vercel.app', 'X-Title': 'Creator OS' }, body: JSON.stringify({ model: built.model, messages: built.messages, temperature: built.temperature, max_tokens: context.maxTokens, response_format: context.expectedJsonSchema ? { type: 'json_object' } : undefined }) });
    if (!upstream.ok) { const detail = await upstream.text().catch(() => 'OpenRouter rejected the request.'); return json({ error: upstream.status === 401 ? 'OpenRouter credentials are invalid or missing.' : detail, code: upstream.status === 401 ? 'AUTH_FAILED' : upstream.status === 429 ? 'RATE_LIMITED' : 'PROVIDER_OFFLINE' }, upstream.status === 401 ? 502 : upstream.status); }
    const data = await upstream.json(); const content = data.choices?.[0]?.message?.content ?? '';
    if (!content) return json({ error: 'OpenRouter returned an empty response.', code: 'PROVIDER_OFFLINE' }, 502);
    if (context.expectedJsonSchema) { try { JSON.parse(content); } catch { return json({ error: 'AI returned invalid JSON. Please retry.', code: 'PROVIDER_OFFLINE' }, 502); } }
    return json({ content, model: built.model, generationId: data.id, latencyMs: 0, usage: { promptTokens: data.usage?.prompt_tokens ?? 0, completionTokens: data.usage?.completion_tokens ?? 0, totalTokens: data.usage?.total_tokens ?? 0 } }, 200);
  } catch { return json({ error: 'AI gateway could not process this request.', code: 'PROVIDER_OFFLINE' }, 500); }
}
