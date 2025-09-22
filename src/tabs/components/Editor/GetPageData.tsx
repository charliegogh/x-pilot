import React from 'react'
import eventBus from '~/eventBus'

const app = () => {
  const onToggle = async() => {
    const data = await eventBus?.emitContentScript?.('getPageData', {})
    navigator.clipboard.writeText(
      data.content
    ).then(() => {
      const btn = document.getElementById(`getPageData`)
      if (btn) {
        btn.textContent = '✅ 已复制'
        setTimeout(() => { btn.textContent = '获取网页内容' }, 1200)
      }
    })
  }
  return (
    <button
      onClick={onToggle}
      id={'getPageData'}
      className='mb-2 ml-2 menu-button bg-white border border-gray-300 text-black text-sm px-3 py-2 rounded-full shadow-sm flex items-center gap-2'>
      <span>获取网页内容</span>
    </button>
  )
}

export default app
