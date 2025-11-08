'use client'

import { use } from 'react'
import type { ExerciseContent } from '@/hooks/exercise'

interface ExerciseContentProps {
  contentPromise: Promise<ExerciseContent>
  reveal: boolean
}

export function ExerciseContent({ contentPromise, reveal }: ExerciseContentProps) {
  const content = use(contentPromise)

  return (
    <div className='prose max-w-none'>
      <div
        className={`whitespace-pre-wrap bg-muted p-6 rounded-lg relative transition-filter duration-300 ${
          reveal ? '' : 'blur-sm select-none pointer-events-none'
        }`}
        aria-hidden={!reveal}
      >
        {content.body}
        {!reveal && (
          <div className='absolute inset-0 flex flex-col items-center justify-center bg-background/70 rounded-lg'>
            <p className='text-sm text-muted-foreground mb-3'>
              演習を開始すると内容が表示されます
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
