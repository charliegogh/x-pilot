import { ChatMessage, ChatClientStatus, ChatClientCallbacks, ParseStreamChunk, ParseStreamChunkResult } from './types'

/**
 * BaseLLMStreamClient 抽象实例化类
 */
export abstract class BaseLLMStreamClient {
  protected messageList: ChatMessage[] = []
  protected status: ChatClientStatus = 'init'
  protected contentBuffer = ''
  protected controller: AbortController | null = null
  protected callbacks: ChatClientCallbacks = {}
  // 子类可选钩子，对流片段做二次处理
  protected onStreamChunk?(parsed: ParseStreamChunkResult): void | Promise<void>

  // 使用方结果回调
  public configureCallbacks(callbacks: ChatClientCallbacks): void {
    this.callbacks = callbacks || {}
  }
  // eslint-disable-next-line no-useless-constructor
  constructor(protected readonly parseStreamChunk: ParseStreamChunk) {}

  /** 统一发送 */
  public async send(messages: ChatMessage[]): Promise<void> {
    this.abort()
    this.messageList = messages
    this.contentBuffer = ''
    this.status = 'pending'

    try {
      this.controller = new AbortController()
      const response = await this.doRequest(messages, this.controller.signal)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        let message = '请求失败'
        try {
          const parsed = JSON.parse(errorText)
          message = parsed?.error?.message || message
        } catch {
          if (errorText) message = errorText
        }
        throw new Error(message)
      }

      await this.handleStream(response)
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        this.callbacks.onMessage?.(this.contentBuffer)
      } else {
        this.callbacks.onError?.(err?.message || '请求异常')
      }
      this.status = 'error'
    } finally {
      this.controller = null
    }
  }

    protected abstract doRequest(messages: ChatMessage[], signal: AbortSignal): Promise<Response>

    /** 解析并处理流 */
    protected async handleStream(response: Response): Promise<void> {
      const reader = response.body?.getReader()
      if (!reader) {
        this.status = 'error'
        this.callbacks.onError?.('读取流失败：无 reader')
        return
      }

      this.status = 'streaming'
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (!value) continue
        const parsed = this.parseStreamChunk(value, buffer)

        const { contents, isDone, buffer: newBuffer } =
            parsed
        await this.onStreamChunk?.(parsed)

        buffer = newBuffer

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
}
