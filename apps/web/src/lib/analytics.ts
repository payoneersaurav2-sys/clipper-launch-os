import { supabase } from './supabase';

export type ProductEvent =
  | 'signup_started'
  | 'signup_completed'
  | 'login_completed'
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_skipped'
  | 'onboarding_completed'
  | 'ai_request_started'
  | 'ai_request_completed'
  | 'ai_request_failed'
  | 'content_created'
  | 'content_updated'
  | 'content_completed'
  | 'knowledge_created'
  | 'knowledge_updated'
  | 'campaign_created'
  | 'campaign_updated'
  | 'agency_client_created'
  | 'agency_client_switched'
  | 'agency_ai_used'
  | 'agency_campaign_created'
  | 'pricing_viewed'
  | 'checkout_started'
  | 'checkout_completed'
  | 'feedback_prompt_shown'
  | 'feedback_positive'
  | 'feedback_negative'
  | 'review_submitted';

function sanitizeProperties(props?: Record<string, string | number | boolean | null>) {
  if (!props) return {};
  const maxKeys = 20;
  const maxStringLength = 1000;
  const safe: Record<string, string | number | boolean | null> = {};
  let count = 0;
  for (const [key, value] of Object.entries(props)) {
    if (count >= maxKeys) break;
    if (typeof value === 'string') {
      safe[key] = value.substring(0, maxStringLength);
    } else {
      safe[key] = value;
    }
    count++;
  }
  return safe;
}
export async function trackEvent(
  name: ProductEvent, 
  properties?: Record<string, string | number | boolean | null>,
  workspaceId?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Only track authenticated events for now to prevent spam

    await supabase.from('product_events').insert({
      event_name: name,
      user_id: user.id,
      workspace_id: workspaceId || null,
      properties_safe: sanitizeProperties(properties)
    });
  } catch (error) {
    // Fail silently - analytics should never break the app
    console.debug('Analytics failed:', error);
  }
}

