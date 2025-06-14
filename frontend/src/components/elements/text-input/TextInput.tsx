import React, { InputHTMLAttributes } from 'react'

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  labelText?: string
  labelClassName?: string
  errorMessage?: string | null
}

const TextInput: React.FC<TextInputProps> = ({
  id,
  labelText,
  labelClassName,
  errorMessage,
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
      <input
        id={id}
        {...rest}
        className={`w-full rounded border ${
          errorMessage ? 'border-red-600' : 'border-black'
        } px-3 py-2 focus:outline-none focus:ring ${rest.className || ''}`}
      />
      {errorMessage && <p className='text-xs text-red-600'>{errorMessage}</p>}
    </>
  )
}

export default TextInput
