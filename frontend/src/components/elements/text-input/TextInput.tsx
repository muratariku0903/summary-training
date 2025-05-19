import React, { InputHTMLAttributes } from 'react';

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  labelText?: string;
  labelClassName?: string;
};

const TextInput: React.FC<TextInputProps> = ({
  id,
  labelText,
  labelClassName,
  ...rest
}) => {
  return (
    <>
      {labelText && (
        <label
          htmlFor={id}
          className={`block text-sm font-bold ${labelClassName || ''}`}
        >
          {labelText}
        </label>
      )}
      <input
        id={id}
        {...rest}
        className={`w-full rounded border border-black px-3 py-2 focus:outline-none focus:ring ${
          rest.className || ''
        }`}
      />
    </>
  );
};

export default TextInput;
