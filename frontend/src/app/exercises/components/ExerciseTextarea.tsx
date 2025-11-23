'use client'

import React from 'react'

type ExerciseTextareaProps = {
  value: string
  onChangeAction: (v: string) => void
  id?: string
  label?: string
  placeholder?: string
  className?: string
  maxLength?: number
}

export default function ExerciseTextarea({
  value,
  onChangeAction,
  id = 'summary',
  label,
  placeholder = '本文を要約してください',
  className = '',
  maxLength = 1000,
}: ExerciseTextareaProps) {
  const remaining = maxLength - value.length

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
        onChange={(e) => {
          const v = e.target.value
          onChangeAction(v.length > maxLength ? v.slice(0, maxLength) : v)
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        className='w-full min-h-[160px] rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring'
      />
      <div className='text-right text-xs text-muted-foreground'>
        {remaining >= 0 ? `残り${remaining}文字` : '制限を超えています'}
      </div>
    </div>
  )
}
