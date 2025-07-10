import React from 'react'

type OutlineButtonProps = {
  label: string
  className?: string
  onClick?: () => void
  disable?: boolean
}

const OutlineButton: React.FC<OutlineButtonProps> = ({
  label,
  className,
  onClick,
  disable = false,
}) => {
  const baseClasses =
    'font-bold py-2 px-4 rounded transition-colors border-2 border-black'
  const colorClasses = 'text-black bg-transparent hover:bg-gray-100 active:bg-gray-200'
  const disabledClasses = disable ? 'opacity-50 cursor-not-allowed' : ''

  return (
    <button
      type='button'
      className={`${baseClasses} ${colorClasses} ${disabledClasses} ${className || ''}`}
      onClick={onClick}
      disabled={disable}
    >
      {label}
    </button>
  )
}

export default OutlineButton
