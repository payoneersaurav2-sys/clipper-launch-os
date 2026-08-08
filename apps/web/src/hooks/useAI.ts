// ============================================================
// CREATOR OS — useAI HOOK v2
// The single gateway for all AI operations in the UI.
// Handles: generate, stream, cancel, retry, history, memory.
// ============================================================

import { useState, useRef, useCallback } from 'react';
import { AIPromptContext, AIResponse, AIError, GenerationCategory } from '@clipper/core/src/ai/types';
import { requestAI } from '@/lib/ai-api';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { useMemoryStore } from '@/stores/useMemoryStore';
import { useAISettingsStore } from '@/stores/useAISettingsStore';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';

// Singleton provider — created once, reused across hook instances
export function refreshProvider() {
  // AI configuration is read by the authenticated server gateway on every request.
}

// ---- Types --------------------------------------------------

interface UseAIState {
  isGenerating: boolean;
  isStreaming: boolean;
  streamedText: string;
  error: string | null;
  lastResponse: AIResponse | null;
}

interface GenerateOptions {
  category?: GenerationCategory;
  projectId?: string;
  promptSummary?: string;
  onStream?: (text: string) => void;
  skipHistory?: boolean;
  skipMemory?: boolean;
}

// ---- Hook ---------------------------------------------------

export function useAI() {
  const [state, setState] = useState<UseAIState>({
    isGenerating: false,
    isStreaming: false,
    streamedText: '',
    error: null,
    lastResponse: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const addRecord  = useHistoryStore(s => s.addRecord);
  const getForCtx  = useMemoryStore(s => s.getForContext);
  const { settings, getTemperatureForCreativity, getMaxTokensForLength } = useAISettingsStore();
  const { activeWorkspace } = useWorkspaceStore();

  // ---- Cancel -----------------------------------------------
  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState(s => ({ ...s, isGenerating: false, isStreaming: false }));
  }, []);

  // ---- Core generate (non-streaming) ------------------------
  const generate = useCallback(async (
    ctx: AIPromptContext,
    opts: GenerateOptions = {}
  ): Promise<AIResponse> => {
    setState({ isGenerating: true, isStreaming: false, streamedText: '', error: null, lastResponse: null });

    // Inject memory + settings into context
    const memory = opts.skipMemory ? [] : getForCtx(activeWorkspace?.id, 15);
    const enrichedCtx: AIPromptContext = {
      ...ctx,
      temperature: ctx.temperature ?? getTemperatureForCreativity(),
      maxTokens:   ctx.maxTokens  ?? getMaxTokensForLength(),
      model:       ctx.model      ?? settings.defaultModel,
      taskContext: {
        ...ctx.taskContext,
        memory: [...(ctx.taskContext.memory ?? []), ...memory],
        userPreferences: {
          ...settings,
          ...ctx.taskContext.userPreferences,
        },
        workspace: ctx.taskContext.workspace ?? {
          id:   activeWorkspace?.id   ?? 'default',
          name: activeWorkspace?.name ?? 'Workspace',
        },
      },
    };

    const start = Date.now();
    try {
      const response = await requestAI(enrichedCtx);

      if (!opts.skipHistory) {
        addRecord({
          workspaceId:   activeWorkspace?.id ?? 'default',
          projectId:     opts.projectId,
          category:      opts.category ?? 'custom',
          model:         response.model,
          temperature:   enrichedCtx.temperature!,
          promptSummary: opts.promptSummary ?? ctx.systemPrompt.slice(0, 120),
          response:      response.content,
          usage:         { ...response.usage, estimatedCostUsd: response.usage.estimatedCostUsd },
          latencyMs:     Date.now() - start,
          tags:          [],
        });
      }

      setState(s => ({ ...s, isGenerating: false, lastResponse: response }));
      return response;

    } catch (err: any) {
      const msg = err instanceof AIError ? `[${err.code}] ${err.message}` : String(err.message ?? err);
      setState(s => ({ ...s, isGenerating: false, error: msg }));
      throw err;
    }
  }, [settings, activeWorkspace, getForCtx, getTemperatureForCreativity, getMaxTokensForLength, addRecord]);

  // ---- Streaming generate -----------------------------------
  const generateStream = useCallback(async (
    ctx: AIPromptContext,
    opts: GenerateOptions = {}
  ): Promise<AIResponse> => {
    setState({ isGenerating: true, isStreaming: true, streamedText: '', error: null, lastResponse: null });

    const abort = new AbortController();
    abortRef.current = abort;

    const memory = opts.skipMemory ? [] : getForCtx(activeWorkspace?.id, 15);
    const enrichedCtx: AIPromptContext = {
      ...ctx,
      stream:      true,
      temperature: ctx.temperature ?? getTemperatureForCreativity(),
      maxTokens:   ctx.maxTokens  ?? getMaxTokensForLength(),
      model:       ctx.model      ?? settings.defaultModel,
      taskContext: {
        ...ctx.taskContext,
        memory: [...(ctx.taskContext.memory ?? []), ...memory],
        userPreferences: { ...settings, ...ctx.taskContext.userPreferences },
        workspace: ctx.taskContext.workspace ?? {
          id:   activeWorkspace?.id   ?? 'default',
          name: activeWorkspace?.name ?? 'Workspace',
        },
      },
    };

    const start = Date.now();
    try {
      const response = await requestAI(enrichedCtx);
      if (!abort.signal.aborted) {
        setState(s => ({ ...s, streamedText: response.content }));
        opts.onStream?.(response.content);
      }

      if (!opts.skipHistory && !abort.signal.aborted) {
        addRecord({
          workspaceId:   activeWorkspace?.id ?? 'default',
          projectId:     opts.projectId,
          category:      opts.category ?? 'custom',
          model:         response.model,
          temperature:   enrichedCtx.temperature!,
          promptSummary: opts.promptSummary ?? ctx.systemPrompt.slice(0, 120),
          response:      response.content,
          usage:         response.usage,
          latencyMs:     Date.now() - start,
          tags:          [],
        });
      }

      setState(s => ({ ...s, isGenerating: false, isStreaming: false, lastResponse: response }));
      return response;

    } catch (err: any) {
      if (!abort.signal.aborted) {
        const msg = err instanceof AIError ? `[${err.code}] ${err.message}` : String(err.message ?? err);
        setState(s => ({ ...s, isGenerating: false, isStreaming: false, error: msg }));
      } else {
        setState(s => ({ ...s, isGenerating: false, isStreaming: false }));
      }
      throw err;
    }
  }, [settings, activeWorkspace, getForCtx, getTemperatureForCreativity, getMaxTokensForLength, addRecord]);

  // ---- JSON generate helper (auto-parse + validate) ---------
  const generateJSON = useCallback(async <T>(
    ctx: AIPromptContext,
    opts: GenerateOptions = {}
  ): Promise<T> => {
    const response = await generate(ctx, opts);
    try {
      return JSON.parse(response.content) as T;
    } catch {
      throw new AIError(
        `AI returned invalid JSON: ${response.content.slice(0, 200)}`,
        'INVALID_JSON',
        true
      );
    }
  }, [generate]);

  return {
    // State
    isGenerating: state.isGenerating,
    isStreaming:  state.isStreaming,
    streamedText: state.streamedText,
    error:        state.error,
    lastResponse: state.lastResponse,

    // Actions
    generate,
    generateStream,
    generateJSON,
    cancel,

    // Helpers
    clearError: () => setState(s => ({ ...s, error: null })),
  };
}
