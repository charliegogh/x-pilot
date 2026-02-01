import React, { useEffect, useRef } from 'react'
import { renderMarkdown } from './chat-markdown'
import type { ChatMessage } from '~/tabs/types/chat'

interface ChatListProps {
    messages?: ChatMessage[]
}

/* ===== 内容兜底 ===== */
const getContentAsMarkdown = (content: any): string => {
  if (typeof content === 'string') return content
  if (typeof content === 'object') {
    const lang = content.lang || 'text'
    if (content.raw?.startsWith('```')) return content.raw
    if (typeof content.text === 'string') {
      return `\`\`\`${lang}\n${content.text}\n\`\`\``
    }
    return JSON.stringify(content, null, 2)
  }
  return String(content ?? '')
}

/* ===== 时间格式化 ===== */
const formatTime = (ts: number) => {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/* ===== 默认头像 ===== */
const Avatar = ({ role }: { role: 'user' | 'agent' }) => {
  const isUser = role === 'user'

  return (
    <div
      className={`
        w-10 h-10
        rounded-full
        flex items-center justify-center
        shrink-0
        ${isUser ? 'bg-blue-500' : 'bg-gray-300'}
      `}
    >
      {isUser ? (
        <svg
          viewBox='0 0 24 24'
          className='w-6 h-6 text-white'
          fill='currentColor'
        >
          <path d='M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z' />
        </svg>
      ) : (
        <svg
          className='w-6 h-6 text-gray-700'
          viewBox='0 0 1051 1024' version='1.1'
          xmlns='http://www.w3.org/2000/svg' width='24' height='24'>
          <path
            d='M55.351351 553.402811v110.924108a83.027027 83.027027 0 0 0 166.054054 0v-110.924108a83.027027 83.027027 0 0 0-166.054054 0z m763.101406 211.552865A137.852541 137.852541 0 0 1 774.918919 664.326919v-110.924108A138.378378 138.378378 0 0 1 912.328649 415.135135C898.131027 214.071351 730.499459 55.351351 525.837838 55.351351 321.148541 55.351351 153.544649 214.071351 139.347027 415.135135A138.461405 138.461405 0 0 1 276.756757 553.402811v110.924108a138.378378 138.378378 0 0 1-276.756757 0v-110.924108a138.378378 138.378378 0 0 1 83.303784-126.865297C91.883243 189.523027 286.72 0 525.837838 0s433.954595 189.523027 442.534054 426.537514A138.461405 138.461405 0 0 1 1051.675676 553.402811v110.924108a138.378378 138.378378 0 0 1-184.790487 130.269405 470.763243 470.763243 0 0 1-188.858811 121.21946A96.809514 96.809514 0 0 1 580.912432 1010.162162h-82.528864c-53.690811 0-97.113946-43.174054-97.113946-96.864865 0-53.607784 43.284757-96.864865 97.141621-96.864865h82.473514c34.954378 0 65.536 18.265946 82.639567 45.803244a415.273514 415.273514 0 0 0 154.900757-97.28zM830.27027 553.402811v110.924108a83.027027 83.027027 0 0 0 166.054054 0v-110.924108a83.027027 83.027027 0 0 0-166.054054 0zM498.438919 954.810811h82.473513c23.302919 0 41.79027-18.487351 41.790271-41.513514 0-23.053838-18.570378-41.513514-41.790271-41.513513h-82.473513c-23.302919 0-41.79027 18.487351-41.79027 41.513513 0 23.053838 18.570378 41.513514 41.79027 41.513514z'
          ></path>
        </svg>
      )}
    </div>
  )
}

/* ===== 主组件 ===== */
const ChatList: React.FC<ChatListProps> = ({ messages = [] }) => {
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className='w-full h-full px-4 py-4 overflow-y-auto bg-[#F7F8FA] space-y-4'>
      {messages.length === 0 && (
        <div className='text-sm text-gray-500 text-center mt-12'>
                    欢迎咨询澳门雪茄在线客服
        </div>
      )}

      {messages.map(msg => {
        const isUser = msg.role === 'user'

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-2 ${
              isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            {/* 左侧头像（客服） */}
            {!isUser && <Avatar role='agent'/>}

            {/* 气泡 + 时间 */}
            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`
                  rounded-xl
                  px-2 py-2
                  text-sm
                  leading-6
                `}
              >
                <div
                  className='prose prose-sm max-w-none'
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(getContentAsMarkdown(msg.content))
                  }}
                />
              </div>

              <div className='text-[11px] mt-1 text-gray-400'>
                {formatTime(msg.createdAt)}
                {isUser && msg.status === 'failed' && (
                  <span className='ml-2 text-red-500'>发送失败</span>
                )}
              </div>
            </div>

            {/* 右侧头像（用户） */}
            {isUser && <Avatar role='user' />}
          </div>
        )
      })}

      <div ref={chatEndRef} />
    </div>
  )
}

export default ChatList
