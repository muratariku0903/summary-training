'use client'

import { use } from 'react'
import type { ExerciseContent } from '@/hooks/exercise'

interface ExerciseContentProps {
  contentPromise: Promise<ExerciseContent>
}

export function ExerciseContent({ contentPromise }: ExerciseContentProps) {
  const content = use(contentPromise)

  return (
    <div className='prose max-w-none'>
      <div className='whitespace-pre-wrap bg-muted p-6 rounded-lg'>{content.body}</div>
    </div>
  )
}
