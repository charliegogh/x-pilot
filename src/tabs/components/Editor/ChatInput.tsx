import React from 'react'

interface ChatInputProps {
    chat: {
        isSending?: () => boolean
    }
    inputRef: React.RefObject<HTMLTextAreaElement>
    buttonRef: React.RefObject<HTMLButtonElement>
}

const ChatInput: React.FC<ChatInputProps> = ({
  chat,
  inputRef,
  buttonRef
}) => {
  const sending = chat?.isSending?.() ?? false

  return (
    <div className='w-full'>
      <div className='flex flex-col p-2 bg-white rounded-xl border border-gray-200'>
        {/* 输入框 */}
        <textarea
          ref={inputRef}
          rows={2}
          disabled={sending}
          placeholder='请输入您要咨询的问题…'
          className='
            resize-none
            rounded-lg
            border border-gray-200
            px-3 py-2
            text-sm
            text-gray-800
            bg-white
            appearance-none
            outline-none
            ring-0
            focus:outline-none
            focus:ring-0
            focus:border-gray-200
            transition
          '
        />

        {/* 操作区 */}
        <div className='flex items-center justify-end mt-2 px-1'>
          {/* 左侧：附件上传 */}
          <label
            className='
              w-8 h-8
              flex items-center justify-center
              rounded-md
              cursor-pointer
              text-gray-500
              hover:bg-gray-100
              transition
              mr-2
            '
            title='上传附件'
          >
            {/* 回形针 icon */}
            <svg className='icon' viewBox='0 0 1024 1024' version='1.1'
              xmlns='http://www.w3.org/2000/svg' width='24' height='24'>
              <path
                d='M548.571429 548.571429v274.285714a18.285714 18.285714 0 0 1-18.285715 18.285714h-36.571428a18.285714 18.285714 0 0 1-18.285715-18.285714V548.571429H201.142857a18.285714 18.285714 0 0 1-18.285714-18.285715v-36.571428a18.285714 18.285714 0 0 1 18.285714-18.285715h274.285714V201.142857a18.285714 18.285714 0 0 1 18.285715-18.285714h36.571428a18.285714 18.285714 0 0 1 18.285715 18.285714v274.285714h274.285714a18.285714 18.285714 0 0 1 18.285714 18.285715v36.571428a18.285714 18.285714 0 0 1-18.285714 18.285715H548.571429z'
                fill='#656667' ></path>
            </svg>
            <input
              type='file'
              className='hidden'
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  console.log('选中的文件：', file)
                  // TODO: 调用上传逻辑
                }
              }}
            />
          </label>

          {/* 右侧：发送按钮（图标） */}
          <button
            ref={buttonRef}
            disabled={sending}
            title='发送'
            className={`
              w-8 h-8
              flex items-center justify-center
              rounded-md
              transition
              ${
    sending
      ? 'bg-gray-300 cursor-not-allowed'
      : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
    }
            `}
          >
            <svg className='icon' viewBox='0 0 1024 1024' version='1.1'
              xmlns='http://www.w3.org/2000/svg' width='20' height='20'>
              <path
                d='M691.84 1014.4l-271.36-244.16v79.68l10.24-10.24 44.48 46.08-118.72 115.52V626.24l304.64 274.56 252.8-787.2-786.56 280.96 168.96 164.48 325.76-246.72 38.72 50.88L291.2 643.2 9.28 368.64 1014.72 9.6 691.84 1014.4z'
                fill='#ffffff'></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatInput
