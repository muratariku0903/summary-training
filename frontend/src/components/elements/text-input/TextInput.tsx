import React, { InputHTMLAttributes, ReactNode } from 'react'

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  showValue?: string | null
  edit?: boolean
  labelText?: string
  labelClassName?: string
  errorMessage?: string | null
  rightElement?: ReactNode
}

const TextInput: React.FC<TextInputProps> = ({
  showValue = '',
  id,
  labelText,
  labelClassName,
  errorMessage,
  edit = true,
  rightElement,
  ...rest
}) => {
  return (
    <>
      {labelText && (
        <label
          htmlFor={id}
          className={`block text-sm font-bold ${errorMessage ? 'text-red-600' : ''} ${
            labelClassName || ''
          }`}
        >
          {labelText}
        </label>
      )}

      <div className='flex items-center gap-2'>
        {edit ? (
          <input
            id={id}
            {...rest}
            className={`w-full flex-1 rounded border ${
              errorMessage ? 'border-red-600' : 'border-black'
            } px-3 py-2 focus:outline-none focus:ring ${rest.className || ''}`}
          />
        ) : (
          <div className={`flex-1 rounded border  bg-gray-50 p-3`}>
            <span>{showValue}</span>
          </div>
        )}

        {/* 右側要素 (任意) */}
        {rightElement && <div className='shrink-0'>{rightElement}</div>}
      </div>

      {errorMessage && <p className='text-xs text-red-600'>{errorMessage}</p>}
    </>
  )
}

export default TextInput
