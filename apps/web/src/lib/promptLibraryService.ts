import { supabase } from '@/lib/supabase';

export type PromptCategory = 'Hooks' | 'Captions' | 'Ideas' | 'Scripts' | 'Marketing' | 'Campaigns' | 'Analytics' | 'General' | 'Custom';

export interface SavedPromptRow {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  description: string | null;
  content: string;
  category: PromptCategory | string;
  tags: string[];
  favorite: boolean;
  variables: string[];
  model_preference: string | null;
  system_instructions: string | null;
  output_format: string | null;
  visibility: string;
  version: number;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromptDraft {
  workspaceId: string;
  userId: string;
  title: string;
  description?: string;
  content: string;
  category: PromptCategory | string;
  tags: string[];
  favorite?: boolean;
  variables?: string[];
  modelPreference?: string | null;
  systemInstructions?: string | null;
  outputFormat?: string | null;
  visibility?: string;
}

export const PROMPT_CATEGORIES: readonly PromptCategory[] = [
  'Hooks',
  'Captions',
  'Ideas',
  'Scripts',
  'Marketing',
  'Campaigns',
  'Analytics',
  'General',
  'Custom',
] as const;

export const STARTER_PROMPTS = [
  {
    title: 'Viral Hook Generator',
    description: 'Create ten sharp hooks for a creator concept.',
    content: 'Generate 10 short-form video hooks for {{topic}} targeting {{audience}} in a {{tone}} tone. Keep them punchy, specific, and immediately clickable.',
    category: 'Hooks' as PromptCategory,
    tags: ['hooks', 'short-form', 'viral'],
  },
  {
    title: 'TikTok Caption Generator',
    description: 'Write platform-native captions that feel native and conversion-focused.',
    content: 'Write a TikTok caption for {{topic}} that sounds authentic, includes a soft CTA, and uses a {{tone}} voice. Keep it concise and scannable.',
    category: 'Captions' as PromptCategory,
    tags: ['captions', 'tiktok', 'social'],
  },
  {
    title: 'Short-Form Script Generator',
    description: 'Turn a topic into an engaging script outline.',
    content: 'Create a 30-second short-form video script for {{topic}} aimed at {{audience}}. Include opening hook, value, proof, CTA, and pacing notes.',
    category: 'Scripts' as PromptCategory,
    tags: ['scripts', 'video', 'story'],
  },
  {
    title: 'Content Idea Generator',
    description: 'Generate fresh content angles and formats.',
    content: 'Generate 8 content ideas for {{topic}} for {{platform}}. Make each idea specific, differentiated, and likely to get saves or shares.',
    category: 'Ideas' as PromptCategory,
    tags: ['ideas', 'content', 'planning'],
  },
  {
    title: 'Campaign Content Generator',
    description: 'Turn one idea into a launch-ready content plan.',
    content: 'Create a 7-day campaign content plan for {{product}} targeting {{audience}}. Provide angle, hook, deliverable, CTA, and sequencing.',
    category: 'Campaigns' as PromptCategory,
    tags: ['campaigns', 'launch', 'strategy'],
  },
] as const;

export function extractPromptVariables(content: string): string[] {
  const matches = content.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) ?? [];
  const unique = Array.from(new Set(matches.map(match => match.replace(/\{\{|\}\}/g, '').trim())));
  return unique;
}

export function compilePromptTemplate(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => values[key] ?? `{{${key}}}`);
}

export async function fetchWorkspacePrompts(workspaceId: string): Promise<SavedPromptRow[]> {
  const { data, error } = await supabase
    .from('prompts')
    .select('id, workspace_id, user_id, title, description, content, category, tags, favorite, variables, model_preference, system_instructions, output_format, visibility, version, usage_count, last_used_at, created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as SavedPromptRow[];
}

export async function createPrompt(input: PromptDraft): Promise<SavedPromptRow> {
  const payload = {
    workspace_id: input.workspaceId,
    user_id: input.userId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    content: input.content.trim(),
    category: input.category || 'General',
    tags: input.tags ?? [],
    favorite: Boolean(input.favorite),
    variables: input.variables ?? [],
    model_preference: input.modelPreference ?? null,
    system_instructions: input.systemInstructions ?? null,
    output_format: input.outputFormat ?? null,
    visibility: input.visibility ?? 'private',
    version: 1,
  };

  const { data, error } = await supabase
    .from('prompts')
    .insert(payload)
    .select('id, workspace_id, user_id, title, description, content, category, tags, favorite, variables, model_preference, system_instructions, output_format, visibility, version, usage_count, last_used_at, created_at, updated_at')
    .single();

  if (error) throw error;
  return data as SavedPromptRow;
}

export async function updatePrompt(id: string, updates: Partial<PromptDraft>): Promise<SavedPromptRow> {
  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
  if (updates.content !== undefined) payload.content = updates.content.trim();
  if (updates.category !== undefined) payload.category = updates.category || 'General';
  if (updates.tags !== undefined) payload.tags = updates.tags ?? [];
  if (updates.favorite !== undefined) payload.favorite = Boolean(updates.favorite);
  if (updates.variables !== undefined) payload.variables = updates.variables ?? [];
  if (updates.modelPreference !== undefined) payload.model_preference = updates.modelPreference ?? null;
  if (updates.systemInstructions !== undefined) payload.system_instructions = updates.systemInstructions ?? null;
  if (updates.outputFormat !== undefined) payload.output_format = updates.outputFormat ?? null;
  if (updates.visibility !== undefined) payload.visibility = updates.visibility ?? 'private';

  const { data, error } = await supabase
    .from('prompts')
    .update(payload)
    .eq('id', id)
    .select('id, workspace_id, user_id, title, description, content, category, tags, favorite, variables, model_preference, system_instructions, output_format, visibility, version, usage_count, last_used_at, created_at, updated_at')
    .single();

  if (error) throw error;
  return data as SavedPromptRow;
}

export async function deletePrompt(id: string): Promise<void> {
  const { error } = await supabase.from('prompts').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicatePrompt(prompt: SavedPromptRow, workspaceId: string, userId: string): Promise<SavedPromptRow> {
  return createPrompt({
    workspaceId,
    userId,
    title: `${prompt.title} Copy`,
    description: prompt.description ?? undefined,
    content: prompt.content,
    category: prompt.category,
    tags: prompt.tags ?? [],
    favorite: false,
    variables: prompt.variables ?? [],
    modelPreference: prompt.model_preference,
    systemInstructions: prompt.system_instructions,
    outputFormat: prompt.output_format,
    visibility: prompt.visibility,
  });
}

export async function toggleFavorite(id: string, favorite: boolean): Promise<SavedPromptRow> {
  return updatePrompt(id, { favorite });
}

export async function incrementPromptUsage(id: string): Promise<void> {
  const { data, error: fetchError } = await supabase.from('prompts').select('usage_count').eq('id', id).single();
  if (fetchError) throw fetchError;

  const { error } = await supabase.from('prompts').update({ usage_count: (data?.usage_count ?? 0) + 1, last_used_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}
