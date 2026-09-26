import { ChatMessage } from '../packages/core/src/ai/types';

export const AI_CONTEXT_POLICIES: Record<string, { profileFields: string[], maxKnowledgeItems: number, priority: number }> = {
  'hook-engine': {
    profileFields: ['target_audience', 'tone', 'primary_offer', 'content_pillars'],
    maxKnowledgeItems: 3,
    priority: 1
  },
  'caption-os': {
    profileFields: ['tone', 'target_audience', 'platforms'],
    maxKnowledgeItems: 3,
    priority: 1
  },
  'campaign-os': {
    profileFields: ['target_audience', 'content_pillars', 'primary_offer', 'platforms'],
    maxKnowledgeItems: 5,
    priority: 1
  },
  'ai-assistant': {
    profileFields: ['short_description', 'target_audience', 'tone', 'content_pillars', 'primary_offer', 'dos_and_donts'],
    maxKnowledgeItems: 5,
    priority: 1
  },
  'idea-studio': {
    profileFields: ['target_audience', 'tone', 'content_pillars'],
    maxKnowledgeItems: 4,
    priority: 1
  },
  'default': {
    profileFields: ['short_description', 'target_audience', 'tone'],
    maxKnowledgeItems: 2,
    priority: 1
  }
};

export async function resolveAgencyAIContext(
  supabaseUrl: string,
  supabaseAnonKey: string,
  authorization: string,
  clientId: string,
  feature: string
): Promise<string | null> {
  // 1 & 4. Authenticate User & Authorize Client
  // user_belongs_to_workspace checks direct and agency membership securely in Postgres
  const authRes = await fetch(`${supabaseUrl}/rest/v1/rpc/user_can_edit_workspace`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey, authorization, 'content-type': 'application/json' },
    body: JSON.stringify({ check_workspace_id: clientId }),
  });
  if (!authRes.ok) throw new Error('Authorization check failed.');
  const isAuthorized = await authRes.json();
  if (isAuthorized !== true) throw new Error('Unauthorized client context');

  const policy = AI_CONTEXT_POLICIES[feature] || AI_CONTEXT_POLICIES['default'];

  // 5. Load Brand Profile
  const profileRes = await fetch(`${supabaseUrl}/rest/v1/brand_profiles?workspace_id=eq.${clientId}&select=*`, {
    headers: { apikey: supabaseAnonKey, authorization }
  });
  const profiles = await profileRes.json();
  const profile = profiles?.[0] || null;

  // 6. Retrieve Authorized Knowledge
  // Filter relevant knowledge: limit to maxKnowledgeItems
  const knowledgeRes = await fetch(`${supabaseUrl}/rest/v1/knowledge_items?workspace_id=eq.${clientId}&deleted_at=is.null&select=title,content_excerpt,tags&limit=${policy.maxKnowledgeItems}`, {
    headers: { apikey: supabaseAnonKey, authorization }
  });
  const knowledge = await knowledgeRes.json();

  // 10. Build structured context
  let contextString = '';
  
  if (profile) {
    contextString += `<client_profile>\n`;
    for (const field of policy.profileFields) {
      if (profile[field]) {
        let val = profile[field];
        if (Array.isArray(val)) val = val.join(', ');
        contextString += `${field.replace(/_/g, ' ').toUpperCase()}: ${val}\n`;
      }
    }
    contextString += `</client_profile>\n\n`;
  }

  if (knowledge && Array.isArray(knowledge) && knowledge.length > 0) {
    contextString += `<client_knowledge>\n`;
    for (const k of knowledge) {
      contextString += `Title: ${k.title}\nContent: ${k.content_excerpt || ''}\n\n`;
    }
    contextString += `</client_knowledge>\n`;
  }

  return contextString.length > 0 ? contextString : null;
}

