import { loadClientByModel } from '../api/client'
import eventBus from '~/eventBus'
import { xGuidePrompt, chatWidthPagePrompt } from '~/tabs/prompt/prompt'
import type { ChatMessage } from '~/tabs/types/chat'

type ChatStatus = 'idle' | 'loading' | 'streaming' | 'done' | 'error' | 'aborted'

interface ChatCoreOptions {
  inputField?: HTMLInputElement | HTMLTextAreaElement | null;
  sendButton?: HTMLElement | null;
  defaultInputValue?: string;
  onEmit: (messages: ChatMessage[]) => Promise<void>;
}

const localToolMap: Record<string, (args: any) => Promise<any>> = {
  get_weather: async({ query, limit }: { query: string, limit: string }) => {
    console.log(query, limit)
    return { weather: `${query} 晴天 52℃` }
  }
}

class ChatCore {
  public messages: ChatMessage[] = []
  private status: ChatStatus = 'idle'
  private currentMessageId: string | number = ''
  private inputField: HTMLInputElement | HTMLTextAreaElement | null
  private sendButton: HTMLElement | null
  private inputValue: string
  private emitCallback: (messages: ChatMessage[]) => Promise<void>
  private currentTool: string | null = null
  private model: string = 'deepseek'

  constructor(options: ChatCoreOptions) {
    const urlParams = new URLSearchParams(window.location.search)
    this.model = urlParams.get('model') || 'deepseek'

    this.inputField = options.inputField || null
    this.sendButton = options.sendButton || null
    this.inputValue = options.defaultInputValue || ''
    this.emitCallback = options.onEmit
  }

  public setInputField(field: HTMLInputElement | HTMLTextAreaElement) {
    this.inputField = field
    this.bindInputFieldEvents()
  }

  public setSendButton(button: HTMLElement) {
    this.sendButton = button
    this.bindSendButtonEvents()
  }

  public setCurrentTool(toolName: string | null) {
    this.currentTool = toolName
  }

  public getCurrentTool(): string | null {
    return this.currentTool
  }

  public setModel(model: string) {
    this.model = model
  }

  public getModel(): string {
    return this.model
  }

  public getStatus(): ChatStatus {
    return this.status
  }

  public isLoading(): boolean {
    return this.status === 'streaming' || this.status === 'loading'
  }

  private bindInputFieldEvents(): void {
    this.inputField?.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement
      this.inputValue = target.value
    })

    this.inputField?.addEventListener('keydown', (event) => {
      const keyboardEvent = event as KeyboardEvent
      if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
        keyboardEvent.preventDefault()
        this.send()
      }
    })
  }

  private bindSendButtonEvents(): void {
    this.sendButton?.addEventListener('click', () => {
      this.send()
    })
  }

  public async send(): Promise<void> {
    const trimmedContent = this.inputValue.trim()
    if (!trimmedContent && !this.messages.some(m => m.role === 'tool')) return
    if (this.isLoading()) return

    const tool = this.getCurrentTool()

    if (tool === 'chat_with_page') {
      try {
        const data = await eventBus?.emitContentScript?.('getPageData', {})
        const prompt = chatWidthPagePrompt.replace('[CONTENT]', JSON.stringify(data))
        this.addSystemMessage(prompt)
      } catch (err) {
        console.warn('获取网页数据失败:', err)
      }
    }

    if (tool === 'x_guide') {
      this.addSystemMessage(xGuidePrompt)
    }

    const client = await loadClientByModel(this.model)

    this.status = 'loading'
    const timestamp = Date.now()

    if (trimmedContent) {
      const newMessages: ChatMessage[] = [
        {
          id: `${timestamp}_user`,
          role: 'user',
          content: trimmedContent,
          status: 'done'
        },
        {
          id: timestamp,
          role: 'assistant',
          content: '',
          status: 'pending'
        }
      ]
      this.currentMessageId = timestamp
      this.inputValue = ''
      if (this.inputField) this.inputField.value = ''
      this.appendMessages(newMessages)
    }

    await this.emitCallback(this.messages.filter(msg => msg.status !== 'pending'))
    this.status = 'streaming'

    client.configureCallbacks({
      onMessage: (chunk) => {
        console.log(chunk)
        this.applyResponseChunk({ payload: { choices: { text: [{ content: chunk }] }}})
        this.emitCallback(this.messages)
      },

      onToolCall: async(toolCalls) => {
        const lastIndex = this.messages.length - 1
        const mcpToolMessages: any[] = []
        this.messages[lastIndex].status = 'pending'
        this.status = 'streaming'

        for (const call of toolCalls) {
          const fn = localToolMap[call.function.name]
          const rawArgs = call.function.arguments

          let parsedArgs = {}
          let result = { error: '函数不存在或参数错误' }

          try {
            parsedArgs = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs
            if (fn) result = await fn(parsedArgs)
          } catch (e: any) {
            result = { error: e.message || '执行异常' }
          }

          mcpToolMessages.push({
            role: 'tool',
            tool_call_id: call.id,
            name: call.function.name,
            content: JSON.stringify(result)
          })
        }

        await client.send([
          {
            ...this.messages.find(i => i.id === this.messages[lastIndex].id + '_user')
          },
          {
            id: timestamp,
            role: 'assistant',
            tool_calls: toolCalls.map(tc => ({
              ...tc,
              function: {
                ...tc.function,
                arguments: typeof tc.function.arguments === 'string'
                  ? tc.function.arguments
                  : JSON.stringify(tc.function.arguments)
              }
            })),
            content: '',
            status: 'done'
          },
          ...mcpToolMessages
        ])
      },

      onFinish: () => {
        this.applyResponseChunk({ payload: { choices: { text: [{ content: '' }], status: 2 }}})
        this.status = 'idle'
        this.emitCallback(this.messages)
      },

      onError: (err) => {
        const target = this.messages.find(msg => msg.id === this.currentMessageId)
        if (target) {
          target.content = `【错误】：${err}`
          target.status = 'error'
        }
        this.status = 'error'
        this.emitCallback(this.messages)
      }
    })

    await client.send(this.getValidMessagesForSend())
  }

  private getValidMessagesForSend(extra: ChatMessage[] = []): ChatMessage[] {
    return [
      ...this.messages
        .filter(m => !('tool_calls' in m))
        .map(m => {
          const { status, ...rest } = m
          return rest
        }),
      ...extra
    ]
  }

  public abort(): void {
    if (this.isLoading()) {
      loadClientByModel(this.model).then(client => client.abort?.())
      this.status = 'aborted'
      const target = this.messages.find(msg => msg.id === this.currentMessageId)
      if (target) {
        target.status = 'aborted'
        target.content += ''
      }
    }
  }

  private appendMessages(newMessages: ChatMessage[], reset: boolean = false): void {
    this.messages = reset ? newMessages : [...this.messages, ...newMessages]
  }

  public applyResponseChunk(responseData: any): void {
    const message = this.messages.find(msg => msg.id === this.currentMessageId)
    if (!message) return

    const chunk = responseData?.payload?.choices?.text?.[0]?.content ?? ''
    const isFinished = responseData?.payload?.choices?.status === 2

    if (chunk) message.content += chunk
    message.status = isFinished ? 'done' : 'streaming'
    if (isFinished) this.status = 'idle'

    this.appendMessages([])
  }

  public addSystemMessage(content: string): void {
    const systemMessage: ChatMessage = {
      id: `system_${Date.now()}`,
      role: 'system',
      content,
      status: 'done'
    }
    this.messages = [systemMessage, ...this.messages]
  }
}

export default ChatCore
