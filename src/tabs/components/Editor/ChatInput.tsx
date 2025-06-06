import React from 'react'
import ModelSelector from './ModelSelector'

interface ChatInputProps {
    chat: any
    inputRef: React.RefObject<HTMLTextAreaElement>
    buttonRef: React.RefObject<HTMLButtonElement>
}

const ChatInput: React.FC<ChatInputProps> = ({ chat, inputRef, buttonRef }) => {
  return (
    <div className='w-full'>
      <div className='flex flex-col p-2 bg-white rounded-xl shadow-md text-base'>
        <textarea
          ref={inputRef}
          className='resize-none rounded-xl border-none outline-none shadow-none ring-0 focus:ring-0 focus:ring-transparent focus:outline-none focus:shadow-none transition-all'
          placeholder='询问任何问题'
          required
        ></textarea>

        <span className='w-full flex justify-end mt-2 gap-2'>
          <ModelSelector
            chat={chat}
          />
          <button
            onClick={() => chat.abort?.()}
            style={{ display: chat?.isLoading() ? 'flex' : 'none' }}
            className='w-8 h-8 rounded-md bg-red-500 hover:bg-red-600 flex items-center justify-center transition'
            title='停止回复'
          >
            <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 24 24'>
              <rect x='6' y='6' width='12' height='12' rx='2' />
            </svg>
          </button>

          <button
            ref={buttonRef}
            style={{ display: chat?.isLoading() ? 'none' : 'flex' }}
            className='w-8 h-8 rounded-md bg-[#1A5EFF] hover:bg-[#3c79ff] flex items-center justify-center transition'
            title='发送'
          >
            <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 24 24'>
              <path d='M2 21l21-9L2 3v7l15 2-15 2z' />
            </svg>
          </button>
        </span>
      </div>
    </div>
  )
}

export default ChatInput
