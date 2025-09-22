import React, { useEffect, useRef } from 'react'
import { renderMarkdown } from './chat-markdown'
import { ChatMessage } from '~/tabs/types/chat'

interface ChatListProps {
    messages?: ChatMessage[]
}

// 安全处理 content 的函数
const getContentAsMarkdown = (content: any): string => {
  if (typeof content === 'string') return content

  if (typeof content === 'object') {
    const lang = content.lang || 'text'
    const raw = content.raw
    const code = content.text

    if (typeof raw === 'string' && raw.trim().startsWith('```')) return raw
    if (typeof code === 'string') {
      return `\`\`\`${lang}\n${code}\n\`\`\``
    }

    return JSON.stringify(content, null, 2)
  }

  return String(content ?? '')
}

const ChatList: React.FC<ChatListProps> = ({ messages = [] }) => {
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const showWelcome = messages.length === 0

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    const buttons = document.querySelectorAll('[data-copy]')
    buttons.forEach((btn) => {
      const container = btn.closest('.code-block')
      const codeEl = container?.querySelector('pre code')
      if (!btn || !codeEl) return

      const handleClick = () => {
        navigator.clipboard.writeText(codeEl.textContent || '')
          .then(() => {
            btn.textContent = '✅ 已复制'
            setTimeout(() => {
              btn.textContent = '复制'
            }, 1200)
          })
          .catch(() => {
            btn.textContent = '❌ 失败'
          })
      }

      btn.addEventListener('click', handleClick)
    })

    return () => {
      buttons.forEach((btn) => {
        btn.replaceWith(btn.cloneNode(true))
      })
    }
  }, [messages])

  const getMessageStyle = (role: string) =>
  { return role === 'user' ? 'bg-blue-500 text-white ml-auto px-2' : 'bg-gray-100 text-gray-800 mr-auto' }

  return (
    <div className='w-full h-full p-4 overflow-y-auto space-y-2'>
      {showWelcome && (
        <div className='max-w-[100%] rounded-xl text-sm py-3 px-4 pl-12 text-gray-800 animate-fade-in mt-8'>
          <div className='prose-sm max-w-none'>
            <h1 className='text-xl mb-2'>👋 欢迎使用 <strong>小研 AI 助手</strong>！</h1>
            <p className='mb-2'>我是您的智能科研助手，支持：</p>
            <ul className='list-disc pl-5'>
              <li>📄 一键总结网页内容</li>
              <li>📚 提取文献结构与引用</li>
              <li>🧠 回答科研问题 / 提供算法实现</li>
            </ul>
            <p className='mt-2'>点击下方 <strong>工具</strong> 即可开始使用。</p>
          </div>
        </div>
      )}
      {messages
        .filter(msg => msg && msg.role !== 'system')
        .map(msg => (
          <div key={msg.id} className='flex flex-col max-w-[100%]'>
            <div className={`rounded-xl text-sm py-1 ${getMessageStyle(msg.role)}`}>
              {msg.status === 'pending' ? (
                <span className='flex gap-1 items-center h-6 pl-2'>
                  <span className='w-3 h-3 rounded-full bg-blue-500 animate-pulse-scale'></span>
                </span>
              ) : (
                <div
                  className='chat-content prose-sm max-w-none px-2'
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(getContentAsMarkdown(msg.content))
                  }}
                />
              )}
            </div>

            {/* 复制按钮：仅当消息生成完时显示 */}
            {msg.status === 'done' && msg.role === 'assistant' && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(msg.content, null, 2)
                  ).then(() => {
                    const btn = document.getElementById(`copy-btn-${msg.id}`)
                    if (btn) {
                      btn.textContent = '✅ 已复制'
                      setTimeout(() => { btn.textContent = '📋 复制' }, 1200)
                    }
                  })
                }}
                id={`copy-btn-${msg.id}`}
                className='
    self-start text-xs
    px-3
    rounded-full
    bg-gray-100 text-gray-600
    border border-gray-300
    transition-colors duration-200
    cursor-pointer
    select-none
  '
              >
                    📋 复制
              </button>
            )}
          </div>
        ))}
      <div ref={chatEndRef} />
    </div>
  )
}

export default ChatList
