import React, { InputHTMLAttributes, ReactNode, useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  showValue?: string | null
  edit?: boolean
  labelText?: string
  labelClassName?: string
  errorMessage?: string | null
  rightElement?: ReactNode
  type?: 'text' | 'password'
  testId?: string
}

const TextInput: React.FC<TextInputProps> = ({
  showValue = '',
  id,
  labelText,
  labelClassName,
  errorMessage,
  edit = true,
  rightElement,
  type = 'text',
  testId,
  ...rest
}) => {
  const [visible, setVisible] = useState(type !== 'password')

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
          <>
            <input
              id={id}
              type={type === 'password' && !visible ? 'password' : 'text'}
              {...rest}
              className={`w-full flex-1 rounded border ${
                errorMessage ? 'border-red-600' : 'border-black'
              } px-3 py-2 focus:outline-none focus:ring ${rest.className || ''}`}
              data-testid={testId}
            />
            {type === 'password' && (
              <button
                type='button'
                onClick={() => setVisible((v) => !v)}
                className='shrink-0 p-1'
              >
                {visible ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
              </button>
            )}
          </>
        ) : (
          <div className={`flex-1 rounded border  bg-gray-50 p-3`}>
            <span data-testid={testId}>
              {type === 'password' ? showValue?.replace(/./g, '•') : showValue}
            </span>
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
