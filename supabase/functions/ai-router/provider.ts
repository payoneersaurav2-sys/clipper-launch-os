// Vendored from packages/core/src/ai/provider.ts and adjusted imports to local files

import {
  IAIProvider,
  AIProviderConfig,
  AIPromptContext,
  AIResponse,
  StreamChunk,
  AIError,
  TokenUsage,
} from './types.ts';
import { PromptEngine } from './prompt-engine.ts';

const COST_PER_1M: Record<string, { prompt: number; completion: number }> = {
  'anthropic/claude-3.5-sonnet': { prompt: 3.0,  completion: 15.0 },
  'anthropic/claude-3-haiku':    { prompt: 0.25, completion: 1.25 },
  'openai/gpt-4o':               { prompt: 5.0,  completion: 15.0 },
  'openai/gpt-4o-mini':          { prompt: 0.15, completion: 0.6  },
  'meta-llama/llama-3.1-70b-instruct': { prompt: 0.52, completion: 0.75 },
  'google/gemini-flash-1.5':     { prompt: 0.075, completion: 0.3  },
  'deepseek/deepseek-chat':      { prompt: 0.14, completion: 0.28  },
};

function estimateCost(model: string, usage: TokenUsage): number {
  const costs = COST_PER_1M[model];
  if (!costs) return 0;
  return (
    (usage.promptTokens     / 1_000_000) * costs.prompt +
    (usage.completionTokens / 1_000_000) * costs.completion
  );
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  retryDelayMs = 1000,
  isRetryable?: (err: unknown) => boolean,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const shouldRetry = isRetryable ? isRetryable(err) : true;
      if (!shouldRetry || attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, retryDelayMs * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

export class OpenRouterProvider implements IAIProvider {
  name = 'openrouter' as const;
  config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  private get headers(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type':  'application/json',
      'HTTP-Referer':  'https://creatoros.com',
      'X-Title':       'Creator OS',
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/models', {
        headers: this.headers,
        signal: AbortSignal.timeout(5000),
      });
      return r.ok;
    } catch {
      return false;
    }
  }

  async generate(ctx: AIPromptContext): Promise<AIResponse> {
    const start = Date.now();
    const compressed = PromptEngine.compress(ctx);
    const built = PromptEngine.build(compressed);
    const model = built.model;

    const fn = async () => {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model,
          messages: built.messages,
          temperature: built.temperature,
          max_tokens: ctx.maxTokens,
          response_format: ctx.expectedJsonSchema ? { type: 'json_object' } : undefined,
        }),
        signal: AbortSignal.timeout(this.config.timeout ?? 30_000),
      });

      if (res.status === 429) throw new AIError('Rate limited', 'RATE_LIMITED', true);
      if (res.status === 401) throw new AIError('Auth failed', 'AUTH_FAILED', false);
      if (!res.ok) {
        const body = await res.text().catch(() => res.statusText);
        throw new AIError(`Provider error: ${body}`, 'PROVIDER_OFFLINE', true);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ?? '';

      if (ctx.expectedJsonSchema) {
        try { JSON.parse(content); } catch {
          throw new AIError('Invalid JSON from provider', 'INVALID_JSON', true, content.slice(0, 200));
        }
      }

      const usage: TokenUsage = {
        promptTokens:     data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens:      data.usage?.total_tokens ?? 0,
        estimatedCostUsd: estimateCost(model, {
          promptTokens:     data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
          totalTokens:      data.usage?.total_tokens ?? 0,
        }),
      };

      return {
        content,
        usage,
        model,
        latencyMs: Date.now() - start,
        generationId: data.id,
      } satisfies AIResponse;
    };

    return withRetry(fn, this.config.maxRetries ?? 2, 1000, (e) => {
      return e instanceof AIError && e.retryable;
    });
  }

  async stream(
    ctx: AIPromptContext,
    onChunk: (chunk: StreamChunk) => void,
    signal?: AbortSignal
  ): Promise<AIResponse> {
    const start = Date.now();
    const compressed = PromptEngine.compress(ctx);
    const built = PromptEngine.build(compressed);
    const model = built.model;

    const abortCtrl = new AbortController();
    signal?.addEventListener('abort', () => abortCtrl.abort());

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model,
        messages: built.messages,
        temperature: built.temperature,
        max_tokens: ctx.maxTokens,
        stream: true,
      }),
      signal: abortCtrl.signal,
    });

    if (!res.ok || !res.body) {
      throw new AIError(`Streaming failed: ${res.statusText}`, 'STREAM_INTERRUPTED', true);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split('\n').filter(l => l.trimStart().startsWith('data: '));

        for (const line of lines) {
          const dataStr = line.replace(/^data:\s*/, '').trim();
          if (dataStr === '[DONE]') {
            onChunk({ text: '', done: true });
            continue;
          }
          try {
            const parsed = JSON.parse(dataStr);
            const text = parsed.choices?.[0]?.delta?.content ?? '';
            if (text) {
              fullContent += text;
              onChunk({ text, done: false });
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        onChunk({ text: '', done: true, error: 'Cancelled' });
      } else {
        throw new AIError('Stream interrupted', 'STREAM_INTERRUPTED', true);
      }
    }

    return {
      content: fullContent,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      model,
      latencyMs: Date.now() - start,
    };
  }
}

type ProviderFactory = (config: AIProviderConfig) => IAIProvider;

const REGISTRY: Record<string, ProviderFactory> = {
  openrouter: (cfg) => new OpenRouterProvider(cfg),
};

export function createProvider(config: AIProviderConfig): IAIProvider {
  const factory = REGISTRY[config.name] ?? REGISTRY['openrouter'];
  return factory(config);
}

export function createDefaultProvider(): IAIProvider {
  return createProvider({
    name: 'openrouter',
    apiKey: '',
    defaultModel: 'openai/gpt-4o-mini',
    timeout: 30_000,
    maxRetries: 2,
  });
}
