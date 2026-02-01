import React, { useState, useEffect } from 'react'
import Editor from './components/Editor'
import Main from './components/Main'
import CustomerServiceChatCore from './core/ChatCore'
import type { ChatMessage } from '~/tabs/types/chat'

const App = () => {
  const [chat, setChat] = useState<CustomerServiceChatCore | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // 现在先写死，后面直接来自会话列表
  const sessionId = 'demo-session-001'

  useEffect(() => {
    const instance = new CustomerServiceChatCore({
      sessionId,
      onEmit: async(msgs) => {
        setMessages([...msgs])
      }
    })
    setChat(instance)
    setMessages([...instance.messages])
    return () => {
      instance.destroy()
    }
  }, [sessionId])

  return (
    <div className='flex h-screen w-full flex-col bg-[#F5F6FA]'>
      {/* 对话区 */}
      <div className='flex-1 overflow-y-auto'>
        <Main messages={messages} />
      </div>

      {/* 输入区 */}
      {chat && <Editor chat={chat} />}
    </div>
  )
}

export default App
