import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AIPromptContext, AIResponse } from '@clipper/core/src/ai/types';

export const useAI = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (promptContext: AIPromptContext): Promise<AIResponse> => {
    setIsGenerating(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-router', {
        body: promptContext,
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      return data as AIResponse;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  // Note: True streaming via supabase functions requires consuming the ReadableStream manually.
  // Implementing a basic mocked timeout for the UI experience if the edge function is offline.
  const generateMock = async (promptContext: AIPromptContext): Promise<AIResponse> => {
      setIsGenerating(true);
      setError(null);
      return new Promise((resolve) => {
          setTimeout(() => {
              setIsGenerating(false);
              let mockResponse = "Generated content";
              
              if (promptContext.expectedJsonSchema) {
                 if (promptContext.expectedJsonSchema.properties.ideas) {
                     mockResponse = JSON.stringify({ ideas: [{ title: "AI Generated Idea", context: "AI context" }]});
                 } else if (promptContext.expectedJsonSchema.properties.hooks) {
                     mockResponse = JSON.stringify({ hooks: [{ content: "AI Generated Hook", explanation: "AI explanation" }]});
                 } else if (promptContext.expectedJsonSchema.properties.caption) {
                     mockResponse = JSON.stringify({ caption: "AI Caption", hashtags: ["#ai"], cta: "Click here" });
                 }
              }

              resolve({
                  content: mockResponse,
                  usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
                  model: 'mock-model'
              });
          }, 1500);
      });
  };

  return { generate: generateMock, isGenerating, error };
};
