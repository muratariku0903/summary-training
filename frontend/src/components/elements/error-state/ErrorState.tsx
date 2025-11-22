'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import React from 'react'

type ErrorStateProps = {
  title?: string
  message?: React.ReactNode
  resetAction?: () => void
  retryLabel?: string
  className?: string
  icon?: React.ReactNode
}

export default function ErrorState({
  title = 'データの取得に失敗しました',
  message,
  resetAction,
  retryLabel = '再試行',
  className = '',
  icon,
}: ErrorStateProps) {
  const defaultMessage = (
    <>
      データの読み込み中にエラーが発生しました。
      <br />
      時間をおいて再度お試しください。
    </>
  )

  return (
    <div
      className={`w-full flex flex-col items-center justify-center p-8 space-y-4 ${className}`}
    >
      <div className='flex items-center gap-2 text-destructive'>
        {icon ?? <AlertCircle className='h-6 w-6' />}
        <h2 className='text-lg font-semibold'>{title}</h2>
      </div>
      <p className='text-sm text-muted-foreground text-center max-w-md'>
        {message ?? defaultMessage}
      </p>
      {resetAction && (
        <Button onClick={resetAction} variant='outline'>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
