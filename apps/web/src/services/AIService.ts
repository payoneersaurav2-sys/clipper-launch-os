// ============================================================
// CREATOR OS — CENTRAL AI SERVICE
// Single entry point for ALL AI operations in the product.
// Components never call providers directly.
// ============================================================

import { createDefaultProvider } from '@clipper/core/src/ai/provider';
import { PromptEngine } from '@clipper/core/src/ai/prompt-engine';
import {
  AIPromptContext, AIResponse, AIError, WorkflowStage
} from '@clipper/core/src/ai/types';
import { AI_SCHEMAS } from '@clipper/core/src/ai/schemas';

// Lazy singleton
let _provider = createDefaultProvider();
export const refreshAIProvider = () => { _provider = createDefaultProvider(); };

// ---- Rate limiter (client-side) ----------------------------
const _callTimestamps: number[] = [];
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT     = 30; // 30 calls / minute

function checkRateLimit(): void {
  const now = Date.now();
  const recent = _callTimestamps.filter(t => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    throw new AIError('Rate limit reached. Please wait a moment.', 'RATE_LIMITED', true);
  }
  _callTimestamps.push(now);
  // Trim old entries
  while (_callTimestamps.length > 100) _callTimestamps.shift();
}

// ---- Token accounting --------------------------------------
let _sessionTokens = 0;
export const getSessionTokens = () => _sessionTokens;
export const resetSessionTokens = () => { _sessionTokens = 0; };

// ---- Core generate -----------------------------------------
export async function generate(ctx: AIPromptContext): Promise<AIResponse> {
  checkRateLimit();
  const compressed = PromptEngine.compress(ctx);
  const response = await _provider.generate(compressed);
  _sessionTokens += response.usage.totalTokens;
  return response;
}

// ---- Streaming generate ------------------------------------
export async function generateStream(
  ctx: AIPromptContext,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<AIResponse> {
  checkRateLimit();
  const compressed = PromptEngine.compress(ctx);
  const response = await _provider.stream(
    compressed,
    (chunk) => { if (!chunk.done && chunk.text) onChunk(chunk.text); },
    signal
  );
  _sessionTokens += response.usage.totalTokens;
  return response;
}

// ---- JSON generate (auto-parse) ----------------------------
export async function generateJSON<T>(ctx: AIPromptContext): Promise<T> {
  const response = await generate(ctx);
  try {
    return JSON.parse(response.content) as T;
  } catch {
    throw new AIError(
      `AI returned invalid JSON: ${response.content.slice(0, 200)}`,
      'INVALID_JSON', true
    );
  }
}

// ---- Module-level convenience functions --------------------

interface BaseInput {
  workspaceId: string;
  workspaceName: string;
  niche?: string;
  platform?: string;
  tone?: string;
}

// Ideas
export async function generateIdeas(input: BaseInput & { count?: number; previousIdeas?: string[] }) {
  const count = input.count ?? 5;
  return generateJSON<{ ideas: any[] }>({
    systemPrompt: `Generate ${count} viral content ideas for a ${input.niche ?? 'general'} creator on ${input.platform ?? 'TikTok'}.`,
    developerPrompt: `Return ${count} unique, immediately actionable ideas. Each needs title, angle, context, platform, viralScore (1-10). Return ONLY JSON.`,
    taskContext: {
      workspace: { id: input.workspaceId, name: input.workspaceName, niche: input.niche, platform: input.platform, tone: input.tone },
      workflowStage: 'idea' as WorkflowStage,
      userPreferences: {},
      memory: [],
      previousGenerations: input.previousIdeas ?? [],
    },
    expectedJsonSchema: AI_SCHEMAS.ideas,
    temperature: 0.85,
  });
}

// Hooks
export async function generateHooks(input: BaseInput & { ideaTitle: string; count?: number; previousHooks?: string[] }) {
  return generateJSON<{ hooks: any[] }>({
    systemPrompt: `Generate ${input.count ?? 5} high-performing hooks for: "${input.ideaTitle}"`,
    developerPrompt: `Diverse hooks (question, statement, controversy, curiosity, number, story). Score each 1-10. Platform: ${input.platform ?? 'TikTok'}. Return ONLY JSON.`,
    taskContext: {
      workspace: { id: input.workspaceId, name: input.workspaceName, platform: input.platform },
      workflowStage: 'hook' as WorkflowStage,
      userPreferences: {},
      memory: [],
      previousGenerations: input.previousHooks ?? [],
    },
    expectedJsonSchema: AI_SCHEMAS.hooks,
    temperature: 0.9,
  });
}

// Captions
export async function generateCaption(input: BaseInput & { ideaTitle: string; selectedHook?: string }) {
  return generateJSON<any>({
    systemPrompt: `Write a viral ${input.platform ?? 'TikTok'} caption for: "${input.ideaTitle}"`,
    developerPrompt: `Hook line, value body, CTA, 5-8 hashtags, SEO keywords. Hook: "${input.selectedHook ?? 'create new'}". Tone: ${input.tone ?? 'viral'}. Return ONLY JSON.`,
    taskContext: {
      workspace: { id: input.workspaceId, name: input.workspaceName, platform: input.platform, tone: input.tone },
      workflowStage: 'caption' as WorkflowStage,
      userPreferences: {},
      memory: [],
      previousGenerations: [],
    },
    expectedJsonSchema: AI_SCHEMAS.captions,
    temperature: 0.75,
  });
}

// Campaign plan
export async function generateCampaignPlan(input: BaseInput & { topic: string; durationDays?: number; goal?: string }) {
  return generateJSON<any>({
    systemPrompt: `Create a ${input.durationDays ?? 7}-day content campaign for: "${input.topic}"`,
    developerPrompt: `Detailed calendar. Platform: ${input.platform ?? 'TikTok'}. Goal: ${input.goal ?? 'grow audience'}. Mix content types, include posting times, growth tips. Return ONLY JSON.`,
    taskContext: {
      workspace: { id: input.workspaceId, name: input.workspaceName, platform: input.platform, niche: input.niche, goals: input.goal },
      workflowStage: 'campaign' as WorkflowStage,
      userPreferences: {},
      memory: [],
      previousGenerations: [],
    },
    expectedJsonSchema: AI_SCHEMAS.campaignPlan,
    temperature: 0.7,
  });
}

// Knowledge answer (RAG-lite)
export async function answerFromKnowledge(input: { question: string; context: string; workspaceId: string; workspaceName: string }) {
  return generateJSON<{ answer: string; sources: string[]; confidence: number }>({
    systemPrompt: `Answer this question using the provided knowledge base context: "${input.question}"`,
    developerPrompt: `Use ONLY the provided context to answer. If context is insufficient, say so honestly. Cite source titles. Return JSON with answer, sources array, and confidence 0-1.`,
    userMessage: `Context:\n${input.context}\n\nQuestion: ${input.question}`,
    taskContext: {
      workspace: { id: input.workspaceId, name: input.workspaceName },
      workflowStage: 'idea' as WorkflowStage,
      userPreferences: {},
      memory: [],
      previousGenerations: [],
    },
    expectedJsonSchema: {
      type: 'object',
      properties: {
        answer:     { type: 'string' },
        sources:    { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number' },
      },
      required: ['answer', 'sources', 'confidence'],
    },
    temperature: 0.3,
  });
}
