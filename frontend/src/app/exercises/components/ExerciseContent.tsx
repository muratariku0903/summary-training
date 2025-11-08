'use client'

import { Card, CardContent } from '@/components/ui/card'
import { use } from 'react'

interface ExerciseContentProps {
  contentPromise: Promise<string>
}

export function ExerciseContent({ contentPromise }: ExerciseContentProps) {
  const content = use(contentPromise)

  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='prose max-w-none'>
          <div className='whitespace-pre-wrap bg-muted p-6 rounded-lg'>{content}</div>
        </div>
      </CardContent>
    </Card>
  )
}
