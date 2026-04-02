export type PromptTemplate<T = void> = (context: T) => string;

export class PromptManager {
  private templates = new Map<string, PromptTemplate<any>>();

  register<T>(name: string, template: PromptTemplate<T>) {
    this.templates.set(name, template);
  }

  compile<T>(name: string, context: T): string {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`Prompt template '${name}' not found.`);
    }
    return template(context).trim();
  }
}

export const promptManager = new PromptManager();
