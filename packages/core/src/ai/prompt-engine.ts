// ============================================================
// CREATOR OS — PROMPT ENGINE v2
// Builds fully structured, versioned prompts automatically.
// Developers never concatenate strings manually.
// ============================================================

import { AIPromptContext, ChatMessage, BuiltPrompt, MemoryItem } from './types';

const ENGINE_VERSION = '2.0.0';

const TONE_GUIDELINES: Record<string, string> = {
  casual:       'Use casual, friendly, conversational language. Speak like a friend, not a corporate brand.',
  professional: 'Use clear, professional language. Authoritative but approachable.',
  bold:         'Use bold, direct, confident language. Short sentences. High energy.',
  educational:  'Use educational, structured language. Explain concepts clearly. Step by step.',
  viral:        'Use viral, attention-grabbing language. Think pattern interrupts and hot takes.',
};

const PLATFORM_GUIDELINES: Record<string, string> = {
  tiktok:    'TikTok: Hooks must grab attention in the first 1–2 seconds. Use trending formats. Keep captions under 150 chars. Use 3–5 hashtags.',
  youtube:   'YouTube: Front-load the value. Titles should create curiosity. Descriptions should include timestamps and keywords.',
  instagram: 'Instagram: Visually descriptive. Use line breaks. 5–10 hashtags. CTA should encourage saves and shares.',
  twitter:   'Twitter/X: Concise and punchy. 280 char limit. Threads work well for educational content.',
  universal: 'Multi-platform: Write adaptable content that can be reformatted for any platform.',
};

const LENGTH_GUIDELINES: Record<string, string> = {
  concise:   'Be extremely concise. Return the minimum viable response. No fluff.',
  balanced:  'Be thorough but efficient. Include important detail without over-explaining.',
  detailed:  'Be comprehensive. Include context, alternatives, and thorough explanations.',
};

// ---- Core Persona -------------------------------------------

const CREATOR_OS_PERSONA = `
You are the Creator OS AI, an elite content strategist and creative director built specifically for modern digital creators.

You are not a generic chatbot. You are a trained AI employee with deep expertise in:
- Short-form video content strategy
- Viral hook psychology
- Platform algorithm optimization  
- Audience growth mechanics
- Content monetization
- Creator brand building

You understand Creator OS deeply. You know the user's workspace, their history, their preferences, and their goals.
You never ask the user to repeat context. You never give generic advice. Every response is specific, actionable, and contextual.

Core rules:
1. ALWAYS return valid JSON when a schema is provided
2. NEVER fabricate analytics or statistics
3. ALWAYS acknowledge the user's existing content and context
4. NEVER give the same suggestion twice within a session
5. ALWAYS prioritize viral potential and audience psychology
`.trim();

// ---- Memory Formatter ---------------------------------------

function formatMemory(items: MemoryItem[]): string {
  if (!items || items.length === 0) return '';

  const grouped: Record<string, string[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item.content);
  }

  let out = '### PERSISTENT MEMORY ###\n';
  for (const [category, contents] of Object.entries(grouped)) {
    const label = category.replace(/_/g, ' ').toUpperCase();
    out += `[${label}]\n`;
    for (const c of contents) {
      out += `  • ${c}\n`;
    }
  }
  return out;
}

// ---- Context Formatter ---------------------------------------

function formatContext(ctx: AIPromptContext): string {
  const { taskContext: tc } = ctx;
  let out = '';

  // Workspace
  out += '### WORKSPACE CONTEXT ###\n';
  out += `Workspace: ${tc.workspace.name} (ID: ${tc.workspace.id})\n`;
  if (tc.workspace.niche)    out += `Niche: ${tc.workspace.niche}\n`;
  if (tc.workspace.platform) out += `Primary Platform: ${tc.workspace.platform}\n`;
  if (tc.workspace.tone)     out += `Brand Tone: ${tc.workspace.tone}\n`;
  if (tc.workspace.goals)    out += `Goals: ${tc.workspace.goals}\n`;
  out += `Workflow Stage: ${tc.workflowStage.toUpperCase()}\n`;
  if (tc.currentPage)        out += `Current Module: ${tc.currentPage}\n`;
  out += '\n';

  // Project
  if (tc.project) {
    out += '### PROJECT CONTEXT ###\n';
    out += `Project: ${tc.project.title} (ID: ${tc.project.id})\n`;
    if (tc.project.description) out += `Description: ${tc.project.description}\n`;
    if (tc.project.status)      out += `Status: ${tc.project.status}\n`;
    out += '\n';
  }

  // Campaign
  if (tc.campaign && tc.campaign.title) {
    out += '### CAMPAIGN CONTEXT ###\n';
    out += `Campaign: ${tc.campaign.title}\n`;
    if (tc.campaign.platform)  out += `Platform: ${tc.campaign.platform}\n`;
    if (tc.campaign.goal)      out += `Goal: ${tc.campaign.goal}\n`;
    if (tc.campaign.startDate) out += `Start: ${tc.campaign.startDate}\n`;
    out += '\n';
  }

  // User preferences
  const prefs = tc.userPreferences;
  if (prefs && Object.keys(prefs).length > 0) {
    out += '### USER PREFERENCES ###\n';
    if (prefs.preferredTone)      out += `Tone: ${prefs.preferredTone}\n`;
    if (prefs.preferredPlatform)  out += `Platform: ${prefs.preferredPlatform}\n`;
    if (prefs.responseLength)     out += `Response Length: ${prefs.responseLength}\n`;
    out += '\n';
  }

  // Platform guidelines
  const platform = tc.userPreferences?.preferredPlatform || tc.workspace.platform || 'universal';
  const platformGuide = PLATFORM_GUIDELINES[platform] || PLATFORM_GUIDELINES.universal;
  out += `### PLATFORM GUIDELINES ###\n${platformGuide}\n\n`;

  // Tone guidelines
  const tone = tc.userPreferences?.preferredTone || tc.workspace.tone || 'viral';
  const toneGuide = TONE_GUIDELINES[tone as string] || TONE_GUIDELINES.viral;
  out += `### TONE GUIDELINES ###\n${toneGuide}\n\n`;

  // Response length
  const length = tc.userPreferences?.responseLength || 'balanced';
  out += `### RESPONSE LENGTH ###\n${LENGTH_GUIDELINES[length]}\n\n`;

  // Previous generations (avoid repeats)
  if (tc.previousGenerations && tc.previousGenerations.length > 0) {
    out += '### PREVIOUS GENERATIONS (avoid repeating) ###\n';
    tc.previousGenerations.slice(-5).forEach(g => {
      out += `  • ${g.substring(0, 100)}...\n`;
    });
    out += '\n';
  }

  // RAG: Prompt Library
  if (tc.relevantPrompts && tc.relevantPrompts.length > 0) {
    out += '### RELEVANT SAVED PROMPTS ###\n';
    tc.relevantPrompts.forEach(p => out += `  • ${p}\n`);
    out += '\n';
  }

  // RAG: Knowledge Vault
  if (tc.relevantKnowledge && tc.relevantKnowledge.length > 0) {
    out += '### KNOWLEDGE VAULT CONTEXT ###\n';
    tc.relevantKnowledge.forEach(k => out += `  • ${k}\n`);
    out += '\n';
  }

  return out;
}

// ---- Schema Formatter ----------------------------------------

function formatSchema(schema: Record<string, unknown>): string {
  return [
    '### OUTPUT FORMAT ###',
    'You MUST return a single, valid JSON object matching the schema below.',
    'Do NOT include markdown code blocks. Do NOT include any text outside the JSON.',
    `Schema:\n${JSON.stringify(schema, null, 2)}`,
  ].join('\n');
}

// ---- Prompt Engine ------------------------------------------

export class PromptEngine {
  
  /**
   * Builds the full structured prompt from a context object.
   * Never concatenate strings manually — always use this.
   */
  static build(ctx: AIPromptContext): BuiltPrompt {
    const messages: ChatMessage[] = [];

    // --- SYSTEM MESSAGE ---
    let systemContent = CREATOR_OS_PERSONA + '\n\n';
    systemContent += '---\n\n';
    systemContent += `### DEVELOPER INSTRUCTIONS ###\n${ctx.developerPrompt}\n\n`;
    systemContent += formatContext(ctx);
    systemContent += formatMemory(ctx.taskContext.memory || []);
    if (ctx.taskContext.memory?.length) systemContent += '\n';

    if (ctx.expectedJsonSchema) {
      systemContent += formatSchema(ctx.expectedJsonSchema);
    }

    messages.push({ role: 'system', content: systemContent.trim() });

    // --- USER MESSAGE ---
    const userContent = ctx.userMessage
      ? ctx.userMessage
      : ctx.systemPrompt; // fallback: task description becomes user message

    messages.push({ role: 'user', content: userContent });

    return {
      messages,
      version: { version: ENGINE_VERSION, createdAt: new Date().toISOString() },
      model: ctx.model || 'anthropic/claude-3.5-sonnet',
      temperature: ctx.temperature ?? 0.7,
      expectedSchema: ctx.expectedJsonSchema,
    };
  }

  /**
   * Estimates rough token count for a built prompt.
   * Approximation: ~1 token per 4 characters.
   */
  static estimateTokens(prompt: BuiltPrompt): number {
    const totalChars = prompt.messages.reduce((acc, m) => acc + m.content.length, 0);
    return Math.ceil(totalChars / 4);
  }

  /**
   * Compress context when approaching token limits.
   * Removes least-important memory items and truncates previous generations.
   */
  static compress(ctx: AIPromptContext, targetTokens = 6000): AIPromptContext {
    const built = PromptEngine.build(ctx);
    const estimated = PromptEngine.estimateTokens(built);

    if (estimated <= targetTokens) return ctx;

    // Strategy 1: reduce previous generations
    const compressed = {
      ...ctx,
      taskContext: {
        ...ctx.taskContext,
        previousGenerations: ctx.taskContext.previousGenerations.slice(-2),
        memory: ctx.taskContext.memory
          .filter(m => m.weight > 0.5)
          .slice(0, 10),
        relevantKnowledge: ctx.taskContext.relevantKnowledge?.slice(0, 3),
        relevantPrompts: ctx.taskContext.relevantPrompts?.slice(0, 2),
      },
    };

    return compressed;
  }
}
