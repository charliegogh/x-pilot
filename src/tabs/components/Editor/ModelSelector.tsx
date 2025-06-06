import React, { useState, useEffect } from 'react'
import { DownOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Dropdown, Space } from 'antd'

interface ModelSelectorProps {
  chat: any
}

const modelOptions = [
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'glm', label: 'GLM-4-Plus' },
  { id: 'Qwen3', label: 'Qwen3-mcp' }
]

const ModelSelector: React.FC<ModelSelectorProps> = ({ chat }) => {
  const [currentModel, setCurrentModel] = useState<string>('deepseek')

  useEffect(() => {
    if (chat?.getModel) {
      setCurrentModel(chat.getModel())
    }
  }, [chat])

  const handleSelect: MenuProps['onClick'] = ({ key }) => {
    setCurrentModel(key)
    chat?.setModel?.(key)
    const url = new URL(window.location.href)
    url.searchParams.set('model', key)
    window.history.replaceState({}, '', url.toString())
  }

  const items: MenuProps['items'] = modelOptions.map((item) => ({
    key: item.id,
    label: item.label
  }))

  return (
    <div className='flex items-center'>
      <Dropdown menu={{ items, onClick: handleSelect }} trigger={['click']}>
        <a onClick={(e) => e.preventDefault()}>
          <Space className='bg-white cursor-pointer text-xs px-2 py-0.5 rounded bg-white hover:bg-gray-100 transition'>
            {modelOptions.find((m) => m.id === currentModel)?.label || '选择模型'}
            <DownOutlined style={{ fontSize: 10 }} />
          </Space>
        </a>
      </Dropdown>
    </div>
  )
}

export default ModelSelector
