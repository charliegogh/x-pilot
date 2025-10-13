import { ChatMessage, ParseStreamChunkResult } from '../types'
import { BaseLLMStreamClient } from '../BaseLLMStreamClient'
import { parseStreamChunk } from './parseStreamChunk'

export interface DeepseekClientOptions {
    apiKey?: string
    model?: string
    baseURL?: string
    extraHeaders?: Record<string, string>
}

class Client extends BaseLLMStreamClient {
  private sessionId: string = ''
  constructor(
        private readonly options: DeepseekClientOptions = {}
  ) {
    super(parseStreamChunk)
  }

  protected async doRequest(messages: ChatMessage[], signal: AbortSignal): Promise<Response> {
    const {
      apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-926057d6931b4d31b944eba1239ac85f',
      baseURL = 'https://dashscope.aliyuncs.com/api/v1/apps/30b10332f0d5429494006af087d6fed0/completion',
      extraHeaders
    } = this.options

    return fetch(`${baseURL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-DashScope-SSE': 'enable',
        ...(extraHeaders || {})
      },
      body: JSON.stringify({
        'input': {
          'prompt': this.messageList[this.messageList.length - 1].content,
          'session_id': this.sessionId || ''
        },
        'parameters': {
          'incremental_output': true,
          'flow_stream_mode': 'agent_format'
        },
        'debug': {}
      }),
      signal
    })
  }

  protected async onStreamChunk(parsed: ParseStreamChunkResult) {
    const { sessionId } = parsed
    if (sessionId && !this.sessionId) {
      this.sessionId = sessionId
    }
  }
}

export default new Client()
