import { AIPromptContext } from './types';

export class PromptEngine {
  private context: AIPromptContext;

  constructor(context: AIPromptContext) {
    this.context = context;
  }

  /**
   * Automatically builds a structured prompt without manual string concatenation by the developer.
   * Compiles the system rules, context engine variables, and schemas into standard message arrays.
   */
  buildOpenAIMessages(): { role: string; content: string }[] {
    const messages: { role: string; content: string }[] = [];

    // 1. Core System & Developer Instructions
    let systemContent = `${this.context.systemPrompt}\n\n`;
    systemContent += `### DEVELOPER INSTRUCTIONS ###\n${this.context.developerPrompt}\n\n`;

    // 2. Context Engine Injection
    systemContent += `### WORKSPACE CONTEXT ###\n`;
    systemContent += `Workspace ID: ${this.context.taskContext.workspace}\n`;
    
    if (this.context.taskContext.project) {
      systemContent += `Project Context: ${this.context.taskContext.project}\n`;
    }
    
    systemContent += `Workflow Stage: ${this.context.taskContext.workflowStage.toUpperCase()}\n\n`;

    if (this.context.taskContext.userPreferences && Object.keys(this.context.taskContext.userPreferences).length > 0) {
      systemContent += `### USER PREFERENCES ###\n${JSON.stringify(this.context.taskContext.userPreferences, null, 2)}\n\n`;
    }

    if (this.context.taskContext.memory && this.context.taskContext.memory.length > 0) {
      systemContent += `### PERSISTENT MEMORY ###\n${this.context.taskContext.memory.join('\n')}\n\n`;
    }

    if (this.context.expectedJsonSchema) {
      systemContent += `### OUTPUT FORMAT ###\nYou must return strictly valid JSON matching the following schema:\n${JSON.stringify(this.context.expectedJsonSchema, null, 2)}\n`;
    }

    messages.push({ role: 'system', content: systemContent.trim() });

    return messages;
  }
}
