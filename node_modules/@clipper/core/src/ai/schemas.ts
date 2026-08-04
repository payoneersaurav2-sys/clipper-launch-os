// Instead of relying on full zod in the shared core, we define the JSON schemas
// that will be injected into the Prompt Engine.

export const AI_SCHEMAS = {
  ideas: {
    type: "object",
    properties: {
      ideas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            context: { type: "string", description: "Brief explanation of why this idea works." }
          },
          required: ["title", "context"]
        }
      }
    },
    required: ["ideas"]
  },
  
  hooks: {
    type: "object",
    properties: {
      hooks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            content: { type: "string" },
            explanation: { type: "string", description: "Why this hook will capture attention." }
          },
          required: ["content", "explanation"]
        }
      }
    },
    required: ["hooks"]
  },

  captions: {
    type: "object",
    properties: {
      caption: { type: "string" },
      hashtags: { type: "array", items: { type: "string" } },
      cta: { type: "string" }
    },
    required: ["caption", "hashtags", "cta"]
  }
};
