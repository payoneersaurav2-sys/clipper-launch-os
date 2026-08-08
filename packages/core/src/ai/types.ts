// ============================================================
// CREATOR OS — AI BRAIN TYPE SYSTEM
// ============================================================

// ---- Provider -----------------------------------------------

export type AIProviderName = 'openrouter' | 'openai' | 'anthropic' | 'gemini' | 'local';

export type AIModelId =
  | 'anthropic/claude-3.5-sonnet'
  | 'anthropic/claude-3-haiku'
  | 'openai/gpt-4o'
  | 'openai/gpt-4o-mini'
  | 'meta-llama/llama-3.1-70b-instruct'
  | 'google/gemini-flash-1.5'
  | 'deepseek/deepseek-chat'
  | string; // allow future models

export interface AIProviderConfig {
  name: AIProviderName;
  apiKey: string;
  baseUrl?: string;
  defaultModel: AIModelId;
  timeout?: number;       // ms, default 30000
  maxRetries?: number;    // default 2
}

// ---- Memory --------------------------------------------------

export type MemoryCategory =
  | 'identity'
  | 'writing_style'
  | 'favorite_hooks'
  | 'favorite_ctas'
  | 'favorite_creators'
  | 'preferred_platforms'
  | 'preferred_tone'
  | 'winning_campaigns'
  | 'failed_campaigns'
  | 'user_feedback'
  | 'frequent_prompts'
  | 'recent_conversations'
  | 'long_term'
  | 'short_term';

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  content: string;
  tags: string[];
  weight: number;          // 0–1, relevance weighting
  createdAt: string;       // ISO
  expiresAt?: string;      // ISO, undefined = never
  workspaceId?: string;
}

// ---- Context Engine -----------------------------------------

export type WorkflowStage = 'idea' | 'hook' | 'caption' | 'campaign' | 'analytics' | 'settings';

export interface WorkspaceContext {
  id: string;
  name: string;
  niche?: string;
  platform?: string;       // 'tiktok' | 'youtube' | 'instagram' | ...
  goals?: string;
  tone?: string;
}

export interface ProjectContext {
  id: string;
  title: string;
  description?: string;
  status?: string;
}

export interface CampaignContext {
  id?: string;
  title?: string;
  startDate?: string;
  platform?: string;
  goal?: string;
}

export interface UserPreferences {
  defaultModel?: AIModelId;
  temperature?: number;
  creativity?: 'low' | 'medium' | 'high';
  streaming?: boolean;
  autoSave?: boolean;
  memoryLevel?: 'minimal' | 'standard' | 'full';
  responseLength?: 'concise' | 'balanced' | 'detailed';
  preferredTone?: string;
  preferredPlatform?: string;
}

export interface AIContext {
  workspace: WorkspaceContext;
  project?: ProjectContext;
  campaign?: CampaignContext;
  workflowStage: WorkflowStage;
  currentPage?: string;
  userPreferences: UserPreferences;
  memory: MemoryItem[];
  previousGenerations: string[];
  relevantPrompts?: string[];    // from Prompt Library RAG
  relevantKnowledge?: string[];  // from Knowledge Vault RAG
}

// ---- Prompt Engine ------------------------------------------

export interface PromptVersion {
  version: string;          // e.g. '1.0.3'
  createdAt: string;
  description?: string;
}

export interface BuiltPrompt {
  messages: ChatMessage[];
  version: PromptVersion;
  model: AIModelId;
  temperature: number;
  expectedSchema?: Record<string, unknown>;
  estimatedTokens?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIPromptContext {
  // Core
  systemPrompt: string;
  developerPrompt: string;
  userMessage?: string;
  taskContext: AIContext;

  // Generation config
  model?: AIModelId;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;

  // Schema / output
  expectedJsonSchema?: Record<string, unknown>;
  responseFormat?: 'json' | 'text' | 'markdown';
}

// ---- Response -----------------------------------------------

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd?: number;    // calculated client-side from known pricing
}

export interface AIResponse {
  content: string;
  usage: TokenUsage;
  model: AIModelId;
  latencyMs?: number;
  cached?: boolean;
  fromFallback?: boolean;
  generationId?: string;
}

export interface StreamChunk {
  text: string;
  done: boolean;
  error?: string;
}

// ---- Generation History ------------------------------------

export type GenerationCategory = 'idea' | 'hook' | 'caption' | 'campaign' | 'analytics' | 'custom';

export interface GenerationRecord {
  id: string;
  workspaceId: string;
  projectId?: string;
  category: GenerationCategory;
  model: AIModelId;
  temperature: number;
  promptSummary: string;    // short description
  response: string;         // raw content
  usage: TokenUsage;
  latencyMs: number;
  timestamp: string;        // ISO
  isFavorite: boolean;
  tags: string[];
}

// ---- Token Tracking ----------------------------------------

export interface TokenBudget {
  daily: number;
  monthly: number;
}

export interface UsageStats {
  totalTokens: number;
  totalCostUsd: number;
  byModel: Record<string, number>;
  byCategory: Record<string, number>;
  byDay: Record<string, number>;   // ISO date string → tokens
}

// ---- AI Provider Interface ---------------------------------

export interface IAIProvider {
  name: AIProviderName;
  config: AIProviderConfig;
  generate(context: AIPromptContext): Promise<AIResponse>;
  stream(
    context: AIPromptContext,
    onChunk: (chunk: StreamChunk) => void,
    signal?: AbortSignal
  ): Promise<AIResponse>;
  isAvailable(): Promise<boolean>;
}

// ---- AI Settings Store -------------------------------------

export interface AISettings {
  defaultModel: AIModelId;
  temperature: number;
  creativity: 'low' | 'medium' | 'high';
  streaming: boolean;
  autoSave: boolean;
  memoryLevel: 'minimal' | 'standard' | 'full';
  responseLength: 'concise' | 'balanced' | 'detailed';
  preferredTone: string;
  preferredPlatform: string;
}

// ---- Error types -------------------------------------------

export type AIErrorCode =
  | 'PROVIDER_OFFLINE'
  | 'TIMEOUT'
  | 'INVALID_JSON'
  | 'RATE_LIMITED'
  | 'CONTEXT_OVERFLOW'
  | 'STREAM_INTERRUPTED'
  | 'AUTH_FAILED'
  | 'SUBSCRIPTION_REQUIRED'
  | 'PLAN_NOT_RESOLVED'
  | 'PLAN_LIMIT_REACHED'
  | 'UNKNOWN';

export class AIError extends Error {
  code: AIErrorCode;
  retryable: boolean;
  context?: string;

  constructor(message: string, code: AIErrorCode, retryable = false, context?: string) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.retryable = retryable;
    this.context = context;
  }
}
