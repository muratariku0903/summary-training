'use client'

import React from 'react'

type ExerciseTextareaProps = {
  value: string
  onChangeAction: (v: string) => void
  id?: string
  label?: string
  placeholder?: string
  className?: string
}

export default function ExerciseTextarea({
  value,
  onChangeAction,
  id = 'summary',
  label,
  placeholder = '本文を要約してください',
  className = '',
}: ExerciseTextareaProps) {
  return (
    <div className={`w-full space-y-2 ${className}`}>
      {label && (
        <label htmlFor={id} className='text-sm font-medium'>
          {label}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChangeAction(e.target.value)}
        placeholder={placeholder}
        className='w-full min-h-[160px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring'
      />
    </div>
  )
}
