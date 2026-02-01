import React, { useEffect, useRef } from 'react'
import ChatInput from './ChatInput'

const Editor = ({ chat }: { chat: any }) => {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!chat) return
    if (inputRef.current) chat.setInputField?.(inputRef.current)
    if (buttonRef.current) chat.setSendButton?.(buttonRef.current)
    inputRef.current?.focus()
  }, [chat])

  return (
    <div className='w-full border-t border-gray-100 bg-white'>
      <div className='px-4 py-3 max-w-[960px] mx-auto'>
        <ChatInput chat={chat} inputRef={inputRef} buttonRef={buttonRef} />
      </div>
    </div>
  )
}

export default Editor
