import React, { TextareaHTMLAttributes } from 'react'

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  showValue?: string | null
  edit?: boolean
  labelText?: string
  labelClassName?: string
  errorMessage?: string | null
}

const TextArea: React.FC<TextAreaProps> = ({
  showValue = '',
  id,
  labelText,
  labelClassName,
  errorMessage,
  edit = true,
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

      {edit ? (
        <textarea
          id={id}
          {...rest}
          className={`w-full rounded border ${
            errorMessage ? 'border-red-600' : 'border-black'
          } px-3 py-2 focus:outline-none focus:ring resize-vertical ${
            rest.className || ''
          }`}
        />
      ) : (
        <div className='p-3 border-1 border-black bg-gray-50 min-h-20'>
          <span className='whitespace-pre-wrap'>{showValue}</span>
        </div>
      )}

      {errorMessage && <p className='text-xs text-red-600'>{errorMessage}</p>}
    </>
  )
}

export default TextArea
