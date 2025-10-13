import type { ChatMessage } from '../types'
import { BaseLLMStreamClient } from '../BaseLLMStreamClient'
import { parseStreamChunk } from './parseStreamChunk'

export interface DeepseekClientOptions {
    apiKey?: string
    model?: string
    baseURL?: string
    extraHeaders?: Record<string, string>
}

class DeepseekClient extends BaseLLMStreamClient {
  constructor(
        private readonly options: DeepseekClientOptions = {}
  ) {
    super(parseStreamChunk)
  }

  protected async doRequest(messages: ChatMessage[], signal: AbortSignal): Promise<Response> {
    const {
      apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-6dccbba35e6144a48a7f8915325dd0ac',
      model = 'deepseek-chat',
      baseURL = 'https://api.deepseek.com',
      extraHeaders
    } = this.options

    return fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(extraHeaders || {})
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true
      }),
      signal
    })
  }
}

export default new DeepseekClient()
