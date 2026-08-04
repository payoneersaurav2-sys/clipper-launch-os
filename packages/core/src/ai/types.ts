export type AIProviderName = 'openrouter' | 'claude' | 'openai' | 'gemini';

export interface AIProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
}

export interface AIContext {
  workspace: string;
  project?: string;
  campaign?: string;
  workflowStage: 'idea' | 'hook' | 'caption' | 'launch';
  userPreferences: Record<string, any>;
  memory: string[];
  previousGenerations: string[];
  goals?: string;
  platform?: string;
}

export interface AIPromptContext {
  systemPrompt: string;
  developerPrompt: string;
  taskContext: AIContext;
  expectedJsonSchema?: any;
  temperature?: number;
  model?: string;
}

export interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export interface IAIProvider {
  name: AIProviderName;
  generate(prompt: AIPromptContext): Promise<AIResponse>;
  stream(prompt: AIPromptContext, onChunk: (chunk: string) => void): Promise<AIResponse>;
}
