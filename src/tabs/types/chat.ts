export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

export interface ChatMessage {
    id: string | number
    role: MessageRole
    content: string
    tool_calls?:any
    tool_call_id?:any
    status?: 'pending' | 'streaming' | 'done' | 'error' | 'aborted'
}

