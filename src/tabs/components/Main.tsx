import React from 'react'
import ChatList from './ChatList'
import type { ChatMessage } from '~/tabs/types/chat'
interface MainProps {
  messages: ChatMessage[];
}

const Main: React.FC<MainProps> = ({ messages }) => {
  return (
    <div className='w-full h-full'>
      <ChatList messages={messages} />
    </div>
  )
}

export default Main
