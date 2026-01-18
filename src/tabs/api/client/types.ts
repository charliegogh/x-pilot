export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool'
    content: string
    [k: string]: any
}
export type ToolCallItem = {
    id: string
    type: 'function'
    function: {
        name: string
        arguments: any
    }
}
export type ChatClientStatus = 'init' | 'pending' | 'streaming' | 'done' | 'error';

export interface ChatClientCallbacks {
    onMessage?: (text: string) => void
    onFinish?: (fullContent: string) => void
    onError?: (errorMessage: string) => void
    onToolCall?: (toolCalls: ToolCallItem[]) => void
}
export interface ParseStreamChunkResult {
    contents: string[]
    isDone: boolean
    buffer: string,
    sessionId?: string;
}
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
export type ParseStreamChunk = (value: Uint8Array, buffer: string) => ParseStreamChunkResult
