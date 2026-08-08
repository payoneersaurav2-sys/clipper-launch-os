import { PromptEngine } from '../../packages/core/src/ai/prompt-engine';
import { AI_SCHEMAS } from '../../packages/core/src/ai/schemas';
import {
  buildAnalyticsReportPrompt, buildCampaignPlanPrompt, buildCaptionVariantsPrompt,
  buildExpandIdeaPrompt, buildGenerateCaptionPrompt, buildGenerateHooksPrompt,
  buildGenerateIdeasPrompt, buildScoreHookPrompt,
} from '../../apps/web/src/lib/ai-services';
import type { AIPromptContext } from '../../packages/core/src/ai/types';

export type Size = 'small' | 'normal' | 'large';
export type Operation = { id: string; feature: string; description: string; context: (size: Size) => AIPromptContext };
const ws = { workspaceId: 'cost-lab-local', workspaceName: 'Creator OS Cost Lab' };
const size = <T>(s: Size, values: Record<Size, T>) => values[s];
const analyticsIdeas = (s: Size) => Array.from({ length: size(s, { small: 3, normal: 12, large: 40 }) }, (_, i) => `Creator growth idea ${i + 1}`);

const storyboard = (s: Size): AIPromptContext => ({
  systemPrompt: 'Create a short-form production storyboard for "How new creators can avoid three growth mistakes".',
  developerPrompt: `Platform: TikTok. Hook: "New creators: stop making these 3 growth mistakes." Return JSON object only: {"script":[{"scene":"...","visuals":"...","audio":"...","duration":"..."}],"caption":"...","hashtags":["..."]}. Build ${size(s, { small: 4, normal: 6, large: 8 })} scenes. Make it shoot-ready, specific, and creator-friendly.`,
  taskContext: { workspace: { id: ws.workspaceId, name: ws.workspaceName, platform: 'tiktok', tone: 'educational' }, workflowStage: 'idea', userPreferences: {}, memory: [], previousGenerations: [] },
  expectedJsonSchema: { type: 'object', properties: { script: { type: 'array' }, caption: { type: 'string' }, hashtags: { type: 'array' } }, required: ['script', 'caption'] }, temperature: 0.7,
});
const knowledge = (s: Size): AIPromptContext => ({
  systemPrompt: 'Answer this question using the provided knowledge base context: "Which hook pattern should this creator test next?"',
  developerPrompt: 'Use ONLY the provided context to answer. If context is insufficient, say so honestly. Cite source titles. Return JSON with answer, sources array, and confidence 0-1.',
  userMessage: `Context:\n${Array.from({ length: size(s, { small: 2, normal: 8, large: 24 }) }, (_, i) => `Source ${i + 1}: Problem-first hooks generated stronger completion rates for educational TikTok content.`).join('\n')}\n\nQuestion: Which hook pattern should this creator test next?`,
  taskContext: { workspace: { id: ws.workspaceId, name: ws.workspaceName }, workflowStage: 'idea', userPreferences: {}, memory: [], previousGenerations: [] },
  expectedJsonSchema: { type: 'object', properties: { answer: { type: 'string' }, sources: { type: 'array', items: { type: 'string' } }, confidence: { type: 'number' } }, required: ['answer', 'sources', 'confidence'] }, temperature: 0.3,
});

export const operations: Operation[] = [
  { id: 'idea-generation', feature: 'Idea Studio', description: 'Generate content ideas', context: s => buildGenerateIdeasPrompt({ ...ws, niche: 'fitness education', platform: 'tiktok', tone: 'educational', count: size(s, { small: 5, normal: 20, large: 50 }) }) },
  { id: 'idea-expansion', feature: 'Idea Studio', description: 'Expand a selected idea', context: () => buildExpandIdeaPrompt({ ...ws, ideaTitle: 'Three gym habits silently blocking beginner progress', platform: 'tiktok' }) },
  { id: 'hook-generation', feature: 'Hook Engine', description: 'Generate hooks', context: s => buildGenerateHooksPrompt({ ...ws, ideaTitle: 'Three gym habits silently blocking beginner progress', platform: 'tiktok', count: size(s, { small: 3, normal: 5, large: 12 }) }) },
  { id: 'hook-scoring', feature: 'Hook Engine', description: 'Score and rewrite a hook', context: () => buildScoreHookPrompt({ ...ws, hookContent: 'You are wasting your first 30 days at the gym if you do this.', platform: 'tiktok' }) },
  { id: 'caption-generation', feature: 'Caption OS', description: 'Generate a caption', context: s => buildGenerateCaptionPrompt({ ...ws, ideaTitle: `Beginner gym growth mistakes: ${size(s, { small: 'one quick fix', normal: 'three practical fixes with a save-worthy checklist', large: 'a detailed 7-step progression with beginner constraints and evidence-based explanations' })}`, selectedHook: 'You are wasting your first 30 days at the gym if you do this.', platform: 'tiktok', tone: 'educational' }) },
  { id: 'caption-variants', feature: 'Caption OS', description: 'Generate platform variants', context: s => buildCaptionVariantsPrompt({ ...ws, ideaTitle: 'Three gym habits silently blocking beginner progress', platforms: size(s, { small: ['tiktok'], normal: ['tiktok', 'instagram', 'youtube'], large: ['tiktok', 'instagram', 'youtube', 'twitter', 'universal'] }) }) },
  { id: 'campaign-plan', feature: 'Launch Center', description: 'Generate campaign strategy and calendar', context: s => buildCampaignPlanPrompt({ ...ws, topic: 'Creator OS launch for new content creators', platform: 'tiktok', goal: 'Build waitlist signups', niche: 'creator education', durationDays: size(s, { small: 7, normal: 14, large: 30 }) }) },
  { id: 'campaign-content-plan', feature: 'Campaign OS', description: 'Generate campaign content items', context: s => buildCampaignPlanPrompt({ ...ws, topic: 'Creator OS launch campaign for US-based new creators', platform: 'tiktok', goal: 'Reach 10k qualified followers', niche: 'social media education', durationDays: size(s, { small: 10, normal: 20, large: 30 }) }) },
  { id: 'storyboard-script', feature: 'Content Workspace', description: 'Generate production storyboard/script', context: storyboard },
  { id: 'analytics-report', feature: 'Analytics', description: 'Analyze performance and recommendations', context: s => buildAnalyticsReportPrompt({ ...ws, recentIdeas: analyticsIdeas(s), recentHooks: analyticsIdeas(s), publishedCount: size(s, { small: 3, normal: 20, large: 100 }), platform: 'tiktok' }) },
  { id: 'knowledge-answer', feature: 'Knowledge Vault', description: 'Answer from saved knowledge', context: knowledge },
];

export function buildOperation(operation: Operation, size: Size, model?: string) {
  const context = operation.context(size);
  if (model) context.model = model;
  return { context, built: PromptEngine.build(PromptEngine.compress(context)) };
}
