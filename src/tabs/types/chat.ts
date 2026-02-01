export interface ChatMessage {
    id: string
    sessionId: string
    role: 'user' | 'agent'
    content: any
    createdAt: number
    read: boolean
    status: 'sending' | 'sent' | 'failed'
}
