export interface ChatClient {
    configureCallbacks(callbacks: {
        onMessage: (chunk: any) => void;
        onToolCall?: (toolCalls: any[]) => Promise<void>;
        onFinish?: () => void;
        onError?: (error: any) => void;
    }): void;

    send(messages: any[]): Promise<void>;

    abort?: () => void;
}

export async function loadClientByModel(model:string): Promise<ChatClient> {
  switch (model) {
    case 'deepseek':
      return (await import('./ds')).default
    case 'glm':
      return (await import('./glm')).default
    case 'Qwen3':
      return (await import('./Qwen3')).default
    default:
      throw new Error(`未支持的模型类型: ${model}`)
  }
}
