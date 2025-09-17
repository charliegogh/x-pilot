import { parseStreamChunk } from './parseStreamChunk'
import { ToolCallAggregator } from './ToolCallAggregator'
import type { ChatMessage } from '~/tabs/types/chat'

export type ChatClientStatus = 'init' | 'streaming' | 'done' | 'error';

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
    this.status = 'pending'

    try {
      this.controller = new AbortController()

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sk-6dccbba35e6144a48a7f8915325dd0ac'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: this.messageList,
          stream: true,
          tools: [
            {
              'type': 'function',
              'function': {
                'name': 'nlquery',
                'description': '当用户使用‘推荐、获取、查找、找一下、检索、文章、论文、文献’等关键词，表达对某一主题、领域、关键词等内容的文献获取意图，且没有提供时间范围、机构、作者等结构化要素时，调用该工具。例如：‘找几篇情绪价值相关的核心期刊论文’、‘获取人工智能教育的CSSCI论文’。',
                'parameters': {
                  'type': 'object',
                  'properties': {
                    'query': {
                      'type': 'string',
                      'description': '用户的文献检索请求'
                    }
                  },
                  'required': ['query']
                }
              }
            }
          ]
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

      const { contents, isDone, buffer: newBuffer, toolCallStream, toolCallFinish } =
          parseStreamChunk(value!, buffer)

      buffer = newBuffer

      for (const text of contents) {
        this.contentBuffer += text
        this.callbacks.onMessage?.(text)
      }

      if (toolCallStream) {
        const parts = Object.entries(toolCallStream)
          .map(([id, item]) => ({
            id,
            index: 0,
            function: {
              name: item.name,
              arguments: item.arguments
            }
          }))
        this.toolCallAggregator.append(parts)
      }

      if (toolCallFinish) {
        const toolCalls: {
          id: string;
          type: 'function';
          function: { name: string; arguments: any };
        }[] = this.toolCallAggregator.getFinalToolCalls()
        console.log(toolCalls, '~~~~~~~~~~~~~~~~~')
        this.callbacks.onToolCall?.(toolCalls)
        break
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
