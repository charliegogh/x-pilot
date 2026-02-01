import type { ChatMessage } from '~/tabs/types/chat'

class CustomerServiceChatCore {
  public messages: ChatMessage[] = []

  private sessionId: string
  private inputField: HTMLInputElement | HTMLTextAreaElement | null
  private sendButton: HTMLElement | null
  private inputValue = ''
  private emitCallback: (messages: ChatMessage[]) => Promise<void>
  private mockAgentReply: boolean

  private inputHandler?: (e: Event) => void
  private keydownHandler?: (e: KeyboardEvent) => void
  private clickHandler?: () => void

  constructor(options: {
        sessionId: string
        inputField?: HTMLInputElement | HTMLTextAreaElement | null
        sendButton?: HTMLElement | null
        onEmit: (messages: ChatMessage[]) => Promise<void>
        mockAgentReply?: boolean
    }) {
    this.sessionId = options.sessionId
    this.inputField = options.inputField || null
    this.sendButton = options.sendButton || null
    this.emitCallback = options.onEmit
    this.mockAgentReply = options.mockAgentReply ?? true

    this.loadFromLocal()
  }

  private getStorageKey(): string {
    return `customer-service-chat:${this.sessionId}`
  }

  private saveToLocal() {
    localStorage.setItem(
      this.getStorageKey(),
      JSON.stringify({ messages: this.messages, updatedAt: Date.now() })
    )
  }

  private loadFromLocal() {
    const raw = localStorage.getItem(this.getStorageKey())
    if (!raw) return
    const data = JSON.parse(raw)
    if (Array.isArray(data.messages)) this.messages = data.messages
  }

  public setInputField(field: HTMLInputElement | HTMLTextAreaElement) {
    this.inputField = field
    this.bindInputFieldEvents()
  }

  public setSendButton(button: HTMLElement) {
    this.sendButton = button
    this.bindSendButtonEvents()
  }

  private bindInputFieldEvents() {
    if (!this.inputField) return

    // 防重复绑定：先解绑再绑
    if (this.inputHandler) this.inputField.removeEventListener('input', this.inputHandler)
    if (this.keydownHandler) { // @ts-ignore
      this.inputField.removeEventListener('keydown', this.keydownHandler)
    }

    this.inputHandler = (e) => {
      this.inputValue = (e.target as HTMLInputElement).value
    }

    this.keydownHandler = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this.send()
      }
    }

    this.inputField.addEventListener('input', this.inputHandler)
    this.inputField.addEventListener('keydown', this.keydownHandler)
  }

  private bindSendButtonEvents() {
    if (!this.sendButton) return

    // 防重复绑定：先解绑再绑
    if (this.clickHandler) this.sendButton.removeEventListener('click', this.clickHandler)

    this.clickHandler = () => this.send()
    this.sendButton.addEventListener('click', this.clickHandler)
  }

  public isSending(): boolean {
    return this.messages.some(m => m.role === 'user' && m.status === 'sending')
  }

  public getMessages(): ChatMessage[] {
    return [...this.messages]
  }

  public async send() {
    const content = this.inputValue.trim()
    if (!content) return

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId: this.sessionId,
      role: 'user',
      content,
      createdAt: Date.now(),
      read: true,
      status: 'sending'
    }

    // 本地立即回显
    this.messages.push(msg)
    this.inputValue = ''
    if (this.inputField) this.inputField.value = ''

    this.saveToLocal()
    await this.emitCallback(this.getMessages())

    try {
      // 模拟“发送成功”
      msg.status = 'sent'
    } catch {
      msg.status = 'failed'
    }

    this.saveToLocal()
    await this.emitCallback(this.getMessages())

    if (this.mockAgentReply && msg.status === 'sent') {
      this.simulateAgentReply(msg)
    }
  }

  private simulateAgentReply(userMsg: ChatMessage) {
    const delay = 800 + Math.random() * 1200
    setTimeout(() => {
      const replyText = this.generateMockReply(String(userMsg.content ?? ''))
      this.receiveAgentMessage(replyText)
    }, delay)
  }

  private generateMockReply(content: string): string {
    if (/价格|多少钱/.test(content)) return '您好，这款产品目前有优惠活动，具体价格我可以帮您查询。'
    if (/发货|多久/.test(content)) return '我们一般 24 小时内安排发货，节假日可能略有延迟。'
    if (/你好|您好|在吗/.test(content)) return '您好，欢迎咨询澳门雪茄在线客服，请问有什么可以帮您？'
    return '好的，已收到您的消息，我这边帮您确认一下，请稍等。'
  }

  public receiveAgentMessage(content: string) {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId: this.sessionId,
      role: 'agent',
      content,
      createdAt: Date.now(),
      read: false,
      status: 'sent'
    }

    this.messages.push(msg)
    this.saveToLocal()
    this.emitCallback(this.getMessages())
  }

  public destroy() {
    if (this.inputField && this.inputHandler && this.keydownHandler) {
      this.inputField.removeEventListener('input', this.inputHandler)
      this.inputField.removeEventListener('keydown', this.keydownHandler)
    }
    if (this.sendButton && this.clickHandler) {
      this.sendButton.removeEventListener('click', this.clickHandler)
    }
  }
}

export default CustomerServiceChatCore
