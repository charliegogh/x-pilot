import React, { useRef, useEffect, useState } from 'react'
import ToolMenu from './ToolMenu'
import ChatInput from './ChatInput'

type EditorProps = {
    chat: any;
}

const menuList = [
  {
    id: 'chat_with_page',
    icon: '🌐',
    label: '与网页聊天',
    action: async(chat: any) => {
      chat.setCurrentTool?.('chat_with_page')
    }
  },
  {
    id: 'x_guide',
    icon: '📘',
    label: '研学使用指引',
    action: async(chat: any) => {
      chat.setCurrentTool?.('x_guide')
    }
  }
]

const Editor: React.FC<EditorProps> = ({ chat }) => {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [activeMenuItem, setActiveMenuItem] = useState<null | typeof menuList[0]>(null)

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      const menuEl = document.querySelector('.menu-popup')
      const buttonEl = document.querySelector('.menu-button')
      if (showMenu && menuEl && !menuEl.contains(event.target) && buttonEl && !buttonEl.contains(event.target)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showMenu])

  useEffect(() => {
    if (chat && inputRef.current && buttonRef.current) {
      chat.setInputField(inputRef.current)
      chat.setSendButton(buttonRef.current)
    }
    inputRef.current?.focus()
  }, [chat])

  const handleMenuClick = async(item: typeof menuList[0]) => {
    setShowMenu(false)
    await item.action(chat)
    setActiveMenuItem(item)
    inputRef.current?.focus()
  }

  const handleCloseMode = () => {
    setActiveMenuItem(null)
    chat.setCurrentTool?.(null)
    if (Array.isArray(chat.messages)) {
      chat.messages = chat.messages.filter((msg: any) => msg.role !== 'system')
    }
    inputRef.current?.focus()
  }

  return (
    <div className='w-full'>
      <div className='px-4 m-auto relative flex flex-col items-start'>
        <ToolMenu
          show={showMenu}
          active={activeMenuItem}
          onToggle={() => setShowMenu(prev => !prev)}
          onSelect={handleMenuClick}
          onClose={handleCloseMode}
          menuList={menuList}
        />
        <ChatInput chat={chat} inputRef={inputRef} buttonRef={buttonRef} />
      </div>
    </div>
  )
}

export default Editor
