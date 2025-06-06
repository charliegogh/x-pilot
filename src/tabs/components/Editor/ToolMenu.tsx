import React from 'react'

type MenuItem = {
    id: string
    icon: string
    label: string
    action: (chat: any) => Promise<void>
}

interface ToolMenuProps {
    show: boolean
    active: MenuItem | null
    onToggle: () => void
    onSelect: (item: MenuItem) => void
    onClose: () => void
    menuList: MenuItem[]
}

const ToolMenu: React.FC<ToolMenuProps> = ({ show, active, onToggle, onSelect, onClose, menuList }) => {
  return (
    <div className='relative inline-block text-left mb-2'>
      {active ? (
        <button className='flex items-center justify-between bg-white border border-gray-300 text-black text-sm px-4 py-2 rounded-full shadow-sm gap-2 hover:bg-gray-100'>
          <span className='flex items-center gap-2'>
            {active.icon} {active.label}
          </span>
          <span className='text-lg leading-none text-gray-500 hover:text-red-500' onClick={onClose}>×</span>
        </button>
      ) : (
        <button onClick={onToggle} className='menu-button bg-white border border-gray-300 text-black text-sm px-3 py-2 rounded-full shadow-sm flex items-center gap-2'>
          <span className='text-sm'>🛠️</span>
          <span>工具</span>
        </button>
      )}

      {!active && show && (
        <div className='menu-popup absolute bottom-10 left-0 z-20 w-52 bg-white text-black rounded-xl shadow-lg text-sm border border-gray-200 py-1'>
          <ul>
            {menuList.map((item) => (
              <li
                key={item.id}
                onClick={() => onSelect(item)}
                className='flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer gap-2'
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ToolMenu
