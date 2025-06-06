import React, { useState, useEffect } from 'react'
import Editor from './components/Editor'
import Main from './components/Main'
import ChatCore from './core/ChatCore'
import type { ChatMessage } from '~/tabs/types/chat'

const App = () => {
  const [chatInstance, setChatInstance] = useState<ChatCore | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>(
    [
    ]
  )

  useEffect(() => {
    const chat = new ChatCore({
      onEmit: async() => {
        setMessages([...chat.messages])
      }
    })

    const originalAppend = chat['appendMessages'].bind(chat)
    chat['appendMessages'] = (msg: ChatMessage[], reset = false) => {
      originalAppend(msg, reset)
      setMessages([...chat.messages])
    }

    setChatInstance(chat)
  }, [])

  return (
    <div className='flex h-screen w-full flex-col bg-[#F5F6FA] pb-4'>
      <div className='flex-1 overflow-y-auto'>
        <Main messages={messages} />
      </div>
      <Editor chat={chatInstance} />
    </div>
  )
}

export default App
