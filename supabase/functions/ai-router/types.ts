// Vendored from packages/core/src/ai/types.ts to make function self-contained
// (trimmed comments preserved)

export type AIProviderName = 'openrouter' | 'openai' | 'anthropic' | 'gemini' | 'local';

export type AIModelId =
  | 'anthropic/claude-3.5-sonnet'
  | 'anthropic/claude-3-haiku'
  | 'openai/gpt-4o'
  | 'openai/gpt-4o-mini'
  | 'meta-llama/llama-3.1-70b-instruct'
  | 'google/gemini-flash-1.5'
  | 'deepseek/deepseek-chat'
  | string;

export interface AIProviderConfig {
  name: AIProviderName;
  apiKey: string;
  baseUrl?: string;
  defaultModel: AIModelId;
  timeout?: number;
  maxRetries?: number;
}

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
  weight: number;
  createdAt: string;
  expiresAt?: string;
  workspaceId?: string;
}

export type WorkflowStage = 'idea' | 'hook' | 'caption' | 'campaign' | 'analytics' | 'settings';

export interface WorkspaceContext {
  id: string;
  name: string;
  niche?: string;
  platform?: string;
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
  relevantPrompts?: string[];
  relevantKnowledge?: string[];
}

export interface PromptVersion {
  version: string;
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
  systemPrompt: string;
  developerPrompt: string;
  userMessage?: string;
  taskContext: AIContext;
  model?: AIModelId;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  expectedJsonSchema?: Record<string, unknown>;
  responseFormat?: 'json' | 'text' | 'markdown';
  billingOperation?: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd?: number;
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

export type GenerationCategory = 'idea' | 'hook' | 'caption' | 'campaign' | 'analytics' | 'custom';

export interface GenerationRecord {
  id: string;
  workspaceId: string;
  projectId?: string;
  category: GenerationCategory;
  model: AIModelId;
  temperature: number;
  promptSummary: string;
  response: string;
  usage: TokenUsage;
  latencyMs: number;
  timestamp: string;
  isFavorite: boolean;
  tags: string[];
}

export interface TokenBudget {
  daily: number;
  monthly: number;
}

export interface UsageStats {
  totalTokens: number;
  totalCostUsd: number;
  byModel: Record<string, number>;
  byCategory: Record<string, number>;
  byDay: Record<string, number>;
}

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
  | 'INSUFFICIENT_CREDITS'
  | 'CREDIT_OPERATION_UNAVAILABLE'
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
