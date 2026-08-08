import { AI_SCHEMAS } from '@clipper/core/src/ai/schemas';
import { AIContext, AIPromptContext } from '@clipper/core/src/ai/types';

function baseContext(id: string, name: string): AIContext {
  return {
    workspace: { id, name },
    workflowStage: 'idea',
    userPreferences: {},
    memory: [],
    previousGenerations: [],
  };
}

// ---- Idea Studio --------------------------------------------

export function buildGenerateIdeasPrompt(input: {
  workspaceId: string; workspaceName: string;
  niche?: string; platform?: string; tone?: string;
  count?: number; previousIdeas?: string[];
}): AIPromptContext {
  return {
    systemPrompt: `Generate ${input.count ?? 5} viral content ideas for a ${input.niche ?? 'general'} creator on ${input.platform ?? 'TikTok'}.`,
    developerPrompt: `Create unique, specific, immediately actionable ideas. Score viral potential 1-10. Platform: ${input.platform ?? 'TikTok'}. Niche: ${input.niche ?? 'general'}. Return ONLY JSON.`,
    taskContext: {
      ...baseContext(input.workspaceId, input.workspaceName),
      workflowStage: 'idea',
      previousGenerations: input.previousIdeas ?? [],
      workspace: { id: input.workspaceId, name: input.workspaceName, niche: input.niche, platform: input.platform, tone: input.tone },
    },
    expectedJsonSchema: AI_SCHEMAS.ideas,
    temperature: 0.85,
  };
}

export function buildExpandIdeaPrompt(input: {
  workspaceId: string; workspaceName: string;
  ideaTitle: string; platform?: string;
}): AIPromptContext {
  return {
    systemPrompt: `Deeply expand this content idea: "${input.ideaTitle}"`,
    developerPrompt: `Expand into a full production brief. Include angles, target audience, format recommendations, and inspiration. Return ONLY JSON.`,
    taskContext: { ...baseContext(input.workspaceId, input.workspaceName), workflowStage: 'idea', workspace: { id: input.workspaceId, name: input.workspaceName, platform: input.platform } },
    expectedJsonSchema: AI_SCHEMAS.ideaExpansion,
    temperature: 0.7,
  };
}

// ---- Hook Engine --------------------------------------------

export function buildGenerateHooksPrompt(input: {
  workspaceId: string; workspaceName: string;
  ideaTitle: string; ideaContext?: string;
  platform?: string; count?: number; previousHooks?: string[];
}): AIPromptContext {
  return {
    systemPrompt: `Generate ${input.count ?? 5} high-performing hooks for: "${input.ideaTitle}"`,
    developerPrompt: `Generate diverse hooks (question, statement, controversy, curiosity, number, story). Score each 1-10. Platform: ${input.platform ?? 'TikTok'}. Avoid: ${input.previousHooks?.join(', ') ?? 'none'}. Return ONLY JSON.`,
    taskContext: {
      ...baseContext(input.workspaceId, input.workspaceName),
      workflowStage: 'hook',
      previousGenerations: input.previousHooks ?? [],
      workspace: { id: input.workspaceId, name: input.workspaceName, platform: input.platform },
    },
    expectedJsonSchema: AI_SCHEMAS.hooks,
    temperature: 0.9,
  };
}

export function buildScoreHookPrompt(input: {
  workspaceId: string; workspaceName: string;
  hookContent: string; platform?: string;
}): AIPromptContext {
  return {
    systemPrompt: `Critically score this hook: "${input.hookContent}"`,
    developerPrompt: `Score on pattern interrupt, emotion, clarity, platform fit for ${input.platform ?? 'TikTok'}. Provide an improved rewrite. Return ONLY JSON.`,
    taskContext: { ...baseContext(input.workspaceId, input.workspaceName), workflowStage: 'hook', workspace: { id: input.workspaceId, name: input.workspaceName, platform: input.platform } },
    expectedJsonSchema: AI_SCHEMAS.hookScore,
    temperature: 0.4,
  };
}

// ---- Caption OS ---------------------------------------------

export function buildGenerateCaptionPrompt(input: {
  workspaceId: string; workspaceName: string;
  ideaTitle: string; selectedHook?: string;
  platform?: string; tone?: string;
}): AIPromptContext {
  return {
    systemPrompt: `Write a viral ${input.platform ?? 'TikTok'} caption for: "${input.ideaTitle}"`,
    developerPrompt: `Hook line, value body, clear CTA, 5-8 hashtags, embed SEO keywords naturally. Hook to use: "${input.selectedHook ?? 'create new'}". Tone: ${input.tone ?? 'viral'}. Return ONLY JSON.`,
    taskContext: {
      ...baseContext(input.workspaceId, input.workspaceName),
      workflowStage: 'caption',
      workspace: { id: input.workspaceId, name: input.workspaceName, platform: input.platform, tone: input.tone },
    },
    expectedJsonSchema: AI_SCHEMAS.captions,
    temperature: 0.75,
  };
}

export function buildCaptionVariantsPrompt(input: {
  workspaceId: string; workspaceName: string;
  ideaTitle: string; platforms: string[];
}): AIPromptContext {
  return {
    systemPrompt: `Generate platform-specific caption variants for: "${input.ideaTitle}"`,
    developerPrompt: `Create optimized captions for: ${input.platforms.join(', ')}. Each tailored to platform culture, limits, audience. Return ONLY JSON.`,
    taskContext: { ...baseContext(input.workspaceId, input.workspaceName), workflowStage: 'caption', workspace: { id: input.workspaceId, name: input.workspaceName } },
    expectedJsonSchema: AI_SCHEMAS.captionVariants,
    temperature: 0.75,
  };
}

// ---- Launch Center ------------------------------------------

export function buildCampaignPlanPrompt(input: {
  workspaceId: string; workspaceName: string;
  topic: string; platform?: string;
  durationDays?: number; goal?: string; niche?: string;
}): AIPromptContext {
  return {
    systemPrompt: `Create a ${input.durationDays ?? 7}-day content campaign plan for: "${input.topic}"`,
    developerPrompt: `Build a detailed, operational content calendar. Platform: ${input.platform ?? 'TikTok'}. Goal: ${input.goal ?? 'grow audience'}. Include strategy, 3-5 contentPillars, recommended postingFrequency, and exactly ${input.durationDays ?? 7} schedule entries. Every schedule entry needs a unique topic, contentType, platform, a compelling hook, a specific CTA, and contentPillar. Include posting times and growth tips. Return ONLY JSON matching the requested schema.`,
    taskContext: {
      ...baseContext(input.workspaceId, input.workspaceName),
      workflowStage: 'campaign',
      workspace: { id: input.workspaceId, name: input.workspaceName, platform: input.platform, niche: input.niche, goals: input.goal },
    },
    expectedJsonSchema: AI_SCHEMAS.campaignPlan,
    temperature: 0.7,
  };
}

// ---- Analytics ----------------------------------------------

export function buildAnalyticsReportPrompt(input: {
  workspaceId: string; workspaceName: string;
  recentIdeas?: string[]; recentHooks?: string[];
  publishedCount?: number; platform?: string;
}): AIPromptContext {
  return {
    systemPrompt: `Analyze Creator OS workflow performance and generate recommendations.`,
    developerPrompt: `Recent ideas: ${input.recentIdeas?.join(', ') ?? 'none'}. Hooks: ${input.recentHooks?.join(', ') ?? 'none'}. Published: ${input.publishedCount ?? 0}. Platform: ${input.platform ?? 'TikTok'}. Give honest assessment and prioritized next actions. Return ONLY JSON.`,
    taskContext: {
      ...baseContext(input.workspaceId, input.workspaceName),
      workflowStage: 'analytics',
      workspace: { id: input.workspaceId, name: input.workspaceName, platform: input.platform },
    },
    expectedJsonSchema: AI_SCHEMAS.analyticsReport,
    temperature: 0.5,
  };
}
