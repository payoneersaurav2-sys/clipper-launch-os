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
    const code = failure?.code === 'RATE_LIMITED'
      ? 'RATE_LIMITED'
      : failure?.code === 'AUTH_FAILED'
        ? 'AUTH_FAILED'
        : failure?.code === 'INVALID_JSON'
          ? 'INVALID_JSON'
          : failure?.code === 'PLAN_LIMIT_REACHED'
            ? 'PLAN_LIMIT_REACHED'
            : failure?.code === 'SUBSCRIPTION_REQUIRED'
              ? 'SUBSCRIPTION_REQUIRED'
              : failure?.code === 'PLAN_NOT_RESOLVED'
                ? 'PLAN_NOT_RESOLVED'
                : failure?.code === 'INSUFFICIENT_CREDITS'
                  ? 'INSUFFICIENT_CREDITS'
                  : failure?.code === 'CREDIT_OPERATION_UNAVAILABLE'
                    ? 'CREDIT_OPERATION_UNAVAILABLE'
                : 'PROVIDER_OFFLINE';
    throw new AIError(failure?.error || 'AI generation failed. Please try again.', code, code === 'RATE_LIMITED' || code === 'PROVIDER_OFFLINE' || code === 'INVALID_JSON');
  }
  return payload as AIResponse;
}
