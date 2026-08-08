import { AIError, AIPromptContext, AIResponse } from '@clipper/core/src/ai/types';
import { supabase } from '@/lib/supabase';

/** Calls the same-origin server gateway. OpenRouter credentials never reach the browser. */
export async function requestAI(context: AIPromptContext): Promise<AIResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new AIError('Sign in again to use AI generation.', 'AUTH_FAILED', false);
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ context }),
  });
  const payload = await response.json().catch(() => null) as { error?: string; code?: string } | AIResponse | null;
  if (!response.ok) {
    const failure = payload as { error?: string; code?: string } | null;
    const code = failure?.code === 'RATE_LIMITED' ? 'RATE_LIMITED' : failure?.code === 'AUTH_FAILED' ? 'AUTH_FAILED' : 'PROVIDER_OFFLINE';
    throw new AIError(failure?.error || 'AI generation failed. Please try again.', code, code === 'RATE_LIMITED' || code === 'PROVIDER_OFFLINE');
  }
  return payload as AIResponse;
}
