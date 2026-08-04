import { IAIProvider, AIProviderConfig, AIPromptContext, AIResponse } from './types';
import { PromptEngine } from './prompt-engine';

export class OpenRouterProvider implements IAIProvider {
  name = 'openrouter' as const;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  private buildMessages(context: AIPromptContext) {
    const builder = new PromptEngine(context);
    return builder.buildOpenAIMessages();
  }

  async generate(context: AIPromptContext): Promise<AIResponse> {
    const messages = this.buildMessages(context);
    const model = context.model || this.config.defaultModel;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://clipperlaunch.com', // Required for OpenRouter
        'X-Title': 'Clipper Launch OS',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: context.temperature ?? 0.7,
        response_format: context.expectedJsonSchema ? { type: 'json_object' } : undefined,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      model: data.model,
    };
  }

  async stream(context: AIPromptContext, onChunk: (chunk: string) => void): Promise<AIResponse> {
    const messages = this.buildMessages(context);
    const model = context.model || this.config.defaultModel;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://clipperlaunch.com',
        'X-Title': 'Clipper Launch OS',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: context.temperature ?? 0.7,
        stream: true,
      })
    });

    if (!response.ok || !response.body) {
      throw new Error(`OpenRouter streaming error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));
      
      for (const line of lines) {
        const dataStr = line.replace('data: ', '').trim();
        if (dataStr === '[DONE]') continue;
        
        try {
          const data = JSON.parse(dataStr);
          const text = data.choices[0]?.delta?.content || '';
          fullContent += text;
          onChunk(text);
        } catch (e) {
          console.error('Error parsing SSE:', e);
        }
      }
    }

    return {
      content: fullContent,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }, // Streaming often hides exact usage
      model,
    };
  }
}
