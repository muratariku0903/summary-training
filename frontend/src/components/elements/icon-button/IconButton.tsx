'use client'

import { useState } from 'react'
import Image from 'next/image'

interface IconButtonProps {
  /** 画像のURL（指定しない場合はデフォルトアイコン） */
  iconImageUrl?: string
  /** alt属性とaria-labelに使用 */
  label?: string
  /** ボタンのサイズ */
  size?: 'sm' | 'md' | 'lg'
  /** メニューアイテム */
  menuItems: Array<{
    label: string
    onClick: () => void | Promise<void>
    icon?: React.ReactNode
    disabled?: boolean
  }>
  /** メニューを右側に表示するか（デフォルト: true） */
  menuAlignRight?: boolean
  /** 無効化状態 */
  disabled?: boolean
  /** カスタムクラス */
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

const sizePixels = {
  sm: 32,
  md: 40,
  lg: 48,
}

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

export default function IconButton({
  iconImageUrl,
  label = 'ユーザー',
  size = 'md',
  menuItems,
  menuAlignRight = true,
  disabled = false,
  className = '',
}: IconButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    if (!disabled) {
      setIsMenuOpen(!isMenuOpen)
    }
  }

  const handleMenuItemClick = async (onClick: () => void | Promise<void>) => {
    await onClick()
    setIsMenuOpen(false)
  }

  // デフォルトユーザーアイコン
  const DefaultUserIcon = () => (
    <svg
      className={`${iconSizeClasses[size]} text-gray-600`}
      fill='currentColor'
      viewBox='0 0 20 20'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        fillRule='evenodd'
        d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
        clipRule='evenodd'
      />
    </svg>
  )

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={toggleMenu}
        disabled={disabled}
        className={`
          ${sizeClasses[size]}
          rounded-full 
          bg-gray-300 
          hover:bg-gray-400 
          disabled:bg-gray-200 
          disabled:cursor-not-allowed
          transition-colors 
          duration-200 
          flex 
          items-center 
          justify-center
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          focus:ring-offset-2
          overflow-hidden
        `}
        aria-label={`${label}のメニュー`}
        aria-expanded={isMenuOpen}
        aria-haspopup='true'
      >
        {iconImageUrl ? (
          <Image
            src={iconImageUrl}
            alt={label}
            width={sizePixels[size]}
            height={sizePixels[size]}
            className='rounded-full object-cover'
            priority={false}
          />
        ) : (
          <DefaultUserIcon />
        )}
      </button>

      {/* ドロップダウンメニュー */}
      {isMenuOpen && (
        <>
          {/* 背景オーバーレイ */}
          <div className='fixed inset-0 z-10' onClick={() => setIsMenuOpen(false)} />

          {/* メニュー内容 */}
          <div
            className={`
              absolute 
              ${menuAlignRight ? 'right-0' : 'left-0'} 
              top-full 
              mt-2 
              w-48 
              bg-white 
              shadow-lg 
              z-20
            `}
          >
            <div className='py-1'>
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleMenuItemClick(item.onClick)}
                  disabled={item.disabled}
                  className={`
                    flex
                    items-center
                    w-full 
                    text-left 
                    px-4 
                    py-2 
                    text-sm 
                    text-gray-700 
                    hover:bg-gray-100
                    hover:text-black 
                    disabled:text-gray-400
                    disabled:cursor-not-allowed
                    transition-colors 
                    duration-200
                  `}
                >
                  {item.icon && <span className='mr-2 flex-shrink-0'>{item.icon}</span>}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
