import React from 'react'

type ColorVariant = 'primary' | 'danger' | 'info'

type OutlineButtonProps = {
  label: string
  className?: string
  onClick?: () => void
  disable?: boolean
  color?: ColorVariant
  testId?: string
}

const OutlineButton: React.FC<OutlineButtonProps> = ({
  label,
  className,
  onClick,
  disable = false,
  color = 'primary',
  testId,
}) => {
  const baseClasses =
    'font-bold py-2 px-4 rounded transition-colors border-2 bg-transparent'

  const colorVariants = {
    primary: 'border-black text-black hover:bg-gray-100 active:bg-gray-200',
    danger: 'border-red-500 text-red-500 hover:bg-red-50 active:bg-red-100',
    info: 'border-blue-500 text-blue-500 hover:bg-blue-50 active:bg-blue-100',
  }

  const colorClasses = colorVariants[color]
  const disabledClasses = disable ? 'opacity-50 cursor-not-allowed' : ''

  return (
    <button
      type='button'
      className={`${baseClasses} ${colorClasses} ${disabledClasses} ${className || ''}`}
      onClick={onClick}
      disabled={disable}
      data-testid={testId}
    >
      {label}
    </button>
  )
}

export default OutlineButton
