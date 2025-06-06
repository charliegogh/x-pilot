import { ToolCallAggregator } from './ToolCallAggregator'
import type { ChatMessage } from '~/tabs/types/chat'

export type ChatClientStatus = 'init' | 'streaming' | 'done' | 'error';
export function parseStreamChunk(
  chunk: Uint8Array,
  buffer = ''
): {
  contents: string[];
  isDone: boolean;
  buffer: string;
  sessionId?: string;
} {
  const decoder = new TextDecoder('utf-8')
  const text = buffer + decoder.decode(chunk, { stream: true })

  const lines = text.split('\n')
  const contents: string[] = []
  let remainingBuffer = ''
  let isDone = false
  let sessionId: string | undefined

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith(':HTTP_STATUS')) continue

    if (line === 'data: [DONE]') {
      isDone = true
      continue
    }

    if (!line.startsWith('data:')) continue

    const jsonStr = line.replace('data:', '').trim()
    const isLastLine = i === lines.length - 1

    if (isLastLine && !jsonStr.endsWith('}') && !jsonStr.endsWith(']')) {
      remainingBuffer = line
      continue
    }

    try {
      const json = JSON.parse(jsonStr)
      const text = json?.output?.text ?? ''
      const finish = json?.output?.finish_reason

      if (text) contents.push(text)

      // 提取 session_id（只取第一个）
      if (!sessionId && typeof json?.output?.session_id === 'string') {
        sessionId = json.output.session_id
      }

      if (finish === 'stop') isDone = true
    } catch (err) {
      console.warn('JSON 解析失败，跳过:', jsonStr)
    }
  }

  return {
    contents,
    isDone,
    buffer: remainingBuffer,
    sessionId
  }
}

interface ChatClientCallbacks {
  onMessage?: (text: string) => void;
  onFinish?: (fullContent: string) => void;
  onError?: (errorMessage: string) => void;
  onToolCall?: (
      toolCalls: {
        id: string;
        type: 'function';
        function: {
          name: string;
          arguments: any;
        };
      }[]
  ) => void;
}

class ChatClient {
  private static instance: ChatClient
  private toolCallAggregator = new ToolCallAggregator()
  private messageList: ChatMessage[] = []
  private status: ChatClientStatus = 'init'
  private contentBuffer: string = ''
  private controller: AbortController | null = null
  private sessionId: string = ''
  private callbacks: ChatClientCallbacks = {}

  public static getInstance(): ChatClient {
    if (!ChatClient.instance) {
      ChatClient.instance = new ChatClient()
    }
    return ChatClient.instance
  }

  /** 设置回调 */
  public configureCallbacks(callbacks: ChatClientCallbacks): void {
    this.callbacks = callbacks
  }

  /** 发送请求 */
  public async send(messages: ChatMessage[]): Promise<void> {
    this.abort() // 取消上一个请求
    this.messageList = messages
    this.contentBuffer = ''
    this.status = 'streaming'

    try {
      this.controller = new AbortController()

      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/apps/30b10332f0d5429494006af087d6fed0/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sk-926057d6931b4d31b944eba1239ac85f',
          'X-DashScope-SSE': 'enable'
        },
        body: JSON.stringify({
          'input': {
            'prompt': this.messageList[this.messageList.length - 2].content,
            'session_id': this.sessionId || ''
          },
          'parameters': {
            'incremental_output': true,
            'flow_stream_mode': 'agent_format'
          },
          'debug': {}
        }),
        signal: this.controller.signal
      })

      if (!response.ok) {
        const errorText = await response.text()
        const parsed = JSON.parse(errorText)
        throw new Error(parsed?.error?.message || '请求失败')
      }

      await this.handleStream(response)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        this.callbacks.onMessage?.(this.contentBuffer)
      } else {
        this.callbacks.onError?.(err.message || '请求异常')
      }
      this.status = 'error'
    } finally {
      this.controller = null
    }
  }

  /** 解析并处理流 */
  private async handleStream(response: Response): Promise<void> {
    const reader = response.body?.getReader()
    if (!reader) return

    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const { contents, isDone, buffer: newBuffer, sessionId } =
          parseStreamChunk(value!, buffer)

      buffer = newBuffer
      if (sessionId && !this.sessionId) {
        this.sessionId = sessionId
      }

      for (const text of contents) {
        this.contentBuffer += text
        this.callbacks.onMessage?.(text)
      }

      if (isDone) break
    }

    this.status = 'done'
    this.callbacks.onFinish?.(this.contentBuffer)
  }

  /** 中止请求 */
  public abort(): void {
    if (this.controller) {
      this.controller.abort()
      this.controller = null
    }
    this.status = 'init'
    this.contentBuffer = ''
  }

  /** 当前状态 */
  public getStatus(): ChatClientStatus {
    return this.status
  }

  /** 获取当前完整内容 */
  public getContent(): string {
    return this.contentBuffer
  }
}

export default ChatClient.getInstance()
