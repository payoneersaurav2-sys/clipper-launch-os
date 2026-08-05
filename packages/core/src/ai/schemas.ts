// ============================================================
// CREATOR OS — AI OUTPUT SCHEMAS
// Every AI response is validated against these schemas.
// Never rely on plain text parsing.
// ============================================================

export const AI_SCHEMAS = {

  // ---- Idea Studio -----------------------------------------
  ideas: {
    type: 'object',
    properties: {
      ideas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title:       { type: 'string', description: 'Concise, punchy idea title' },
            angle:       { type: 'string', description: 'Unique narrative angle for this idea' },
            context:     { type: 'string', description: 'Why this idea works for the target audience' },
            platform:    { type: 'string', enum: ['tiktok', 'youtube', 'instagram', 'twitter', 'universal'] },
            difficulty:  { type: 'string', enum: ['easy', 'medium', 'hard'] },
            viralScore:  { type: 'number', description: 'Estimated viral potential 1–10' },
            tags:        { type: 'array', items: { type: 'string' } },
          },
          required: ['title', 'angle', 'context', 'platform', 'viralScore'],
        },
      },
    },
    required: ['ideas'],
  },

  ideaExpansion: {
    type: 'object',
    properties: {
      expanded:     { type: 'string', description: 'Full expanded concept' },
      angles:       { type: 'array', items: { type: 'string' }, description: 'Alternative narrative angles' },
      targetAudience: { type: 'string' },
      contentFormat:  { type: 'string', description: 'Recommended format: talking head, montage, POV, etc.' },
      estimatedLength: { type: 'string' },
      inspiration:    { type: 'array', items: { type: 'string' }, description: 'Similar successful content' },
    },
    required: ['expanded', 'angles', 'targetAudience'],
  },

  // ---- Hook Engine -----------------------------------------
  hooks: {
    type: 'object',
    properties: {
      hooks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            content:      { type: 'string', description: 'The hook text itself (first 3 seconds)' },
            type:         { type: 'string', enum: ['question', 'statement', 'controversy', 'curiosity', 'number', 'story'] },
            explanation:  { type: 'string', description: 'Why this hook captures attention' },
            score:        { type: 'number', description: 'Engagement score 1–10' },
            platform:     { type: 'string' },
          },
          required: ['content', 'type', 'explanation', 'score'],
        },
      },
    },
    required: ['hooks'],
  },

  hookScore: {
    type: 'object',
    properties: {
      score:         { type: 'number', description: 'Overall score 1–10' },
      retentionScore: { type: 'number' },
      clarityScore:   { type: 'number' },
      emotionScore:   { type: 'number' },
      strengths:      { type: 'array', items: { type: 'string' } },
      weaknesses:     { type: 'array', items: { type: 'string' } },
      improvements:   { type: 'array', items: { type: 'string' } },
      rewrite:        { type: 'string', description: 'Improved version of the hook' },
    },
    required: ['score', 'strengths', 'weaknesses', 'rewrite'],
  },

  // ---- Caption OS ------------------------------------------
  captions: {
    type: 'object',
    properties: {
      caption:      { type: 'string' },
      platform:     { type: 'string' },
      hook:         { type: 'string', description: 'First line designed to stop the scroll' },
      body:         { type: 'string' },
      cta:          { type: 'string', description: 'Call to action line' },
      hashtags:     { type: 'array', items: { type: 'string' } },
      keywords:     { type: 'array', items: { type: 'string' }, description: 'SEO keywords embedded' },
      charCount:    { type: 'number' },
      readingLevel: { type: 'string', enum: ['simple', 'standard', 'advanced'] },
    },
    required: ['caption', 'hook', 'cta', 'hashtags'],
  },

  captionVariants: {
    type: 'object',
    properties: {
      variants: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            platform:  { type: 'string' },
            caption:   { type: 'string' },
            hashtags:  { type: 'array', items: { type: 'string' } },
            cta:       { type: 'string' },
          },
          required: ['platform', 'caption'],
        },
      },
    },
    required: ['variants'],
  },

  // ---- Launch Center ---------------------------------------
  campaignPlan: {
    type: 'object',
    properties: {
      title:        { type: 'string' },
      duration:     { type: 'string', description: 'e.g. 7 days' },
      goal:         { type: 'string' },
      schedule: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            day:      { type: 'number' },
            date:     { type: 'string' },
            contentType: { type: 'string' },
            topic:    { type: 'string' },
            platform: { type: 'string' },
            time:     { type: 'string' },
            notes:    { type: 'string' },
          },
          required: ['day', 'contentType', 'topic', 'platform'],
        },
      },
      growthTips:   { type: 'array', items: { type: 'string' } },
    },
    required: ['title', 'schedule', 'goal'],
  },

  // ---- Analytics -------------------------------------------
  analyticsReport: {
    type: 'object',
    properties: {
      summary:       { type: 'string' },
      overallScore:  { type: 'number', description: 'Performance score 1–10' },
      strengths:     { type: 'array', items: { type: 'string' } },
      weaknesses:    { type: 'array', items: { type: 'string' } },
      recommendations: { type: 'array', items: { type: 'string' } },
      nextActions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            action:   { type: 'string' },
            reason:   { type: 'string' },
          },
          required: ['priority', 'action'],
        },
      },
      trendingFormats: { type: 'array', items: { type: 'string' } },
    },
    required: ['summary', 'strengths', 'weaknesses', 'recommendations', 'nextActions'],
  },
};

// ---- Runtime JSON Validator ---------------------------------

export function validateAIResponse<T>(
  data: unknown,
  schemaKey: keyof typeof AI_SCHEMAS
): { valid: boolean; data: T | null; errors: string[] } {
  try {
    if (typeof data !== 'object' || data === null) {
      return { valid: false, data: null, errors: ['Response is not a JSON object'] };
    }
    const schema = AI_SCHEMAS[schemaKey];
    const required = (schema as any).required as string[] | undefined;
    const errors: string[] = [];

    if (required) {
      for (const field of required) {
        if (!(field in (data as Record<string, unknown>))) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    return errors.length === 0
      ? { valid: true, data: data as T, errors: [] }
      : { valid: false, data: null, errors };
  } catch {
    return { valid: false, data: null, errors: ['Schema validation threw an exception'] };
  }
}
