import React from 'react'

type ReversalButtonProps = {
  label: string
  className?: string
  onClick?: () => void
  disable?: boolean
  border?: boolean
  type?: 'button' | 'submit' | 'reset'
  reverse?: boolean
}

const ReversalButton: React.FC<ReversalButtonProps> = ({
  label,
  className,
  onClick,
  border,
  type = 'button',
  reverse = false,
}) => {
  const baseClasses = 'font-bold py-2 px-4 rounded transition-colors'
  const borderClasses = border ? 'border-2 border-black' : ''

  const normalClasses = 'text-black bg-white hover:bg-black hover:text-white'
  const reverseClasses = 'text-white bg-black hover:bg-white hover:text-black'

  const colorClasses = reverse ? reverseClasses : normalClasses

  return (
    <button
      type={type}
      className={`${baseClasses} ${borderClasses} ${colorClasses} ${className || ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export default ReversalButton
