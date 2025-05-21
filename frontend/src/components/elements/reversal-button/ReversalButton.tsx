import React from 'react'

type ReversalButtonProps = {
  label: string
  className?: string
  onClick?: () => void
  disable?: boolean
  border?: boolean
}

const ReversalButton: React.FC<ReversalButtonProps> = ({
  label,
  className,
  onClick,
  border,
}) => {
  return (
    <button
      type='submit'
      className={`text-black font-bold py-2 px-4 rounded hover:bg-black hover:text-white ${
        border ? 'border-2 border-black' : ''
      } ${className}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export default ReversalButton
