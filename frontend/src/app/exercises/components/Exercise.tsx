'use client'

import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Exercise as ExerciseType } from '@/lib/supabase/schema/utils'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EXERCISE_DIFFICULTIES, EXERCISE_TYPES } from '@/lib/constants/ui'
import Loading from '@/components/elements/loading/Loading'
import { ExerciseContent } from './ExerciseContent'
import { ErrorBoundary } from 'react-error-boundary'
import { useExerciseContentPromise } from '@/hooks/exercise'
import ErrorState from '@/components/elements/error-state/ErrorState'
import ExerciseTextarea from './ExerciseTextarea'

interface ExerciseProps {
  exercise: ExerciseType
  contentUrl: string
}

export function Exercise({ exercise, contentUrl }: ExerciseProps) {
  const router = useRouter()
  const [started, setStarted] = useState(false)
  const [summary, setSummary] = useState('')

  const difficulty = EXERCISE_DIFFICULTIES.find((d) => d.value === exercise.difficulty)
  const type = EXERCISE_TYPES.find((t) => t.value === exercise.exercise_type)

  return (
    <div className='w-full mx-auto space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='sm' onClick={() => router.back()} className='gap-2'>
          <ArrowLeft className='h-4 w-4' />
          戻る
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className='flex items-start justify-between gap-4'>
            <div className='space-y-2 flex-1'>
              <CardTitle className='text-2xl'>{exercise.title}</CardTitle>
              {exercise.description && (
                <CardDescription className='text-base'>
                  {exercise.description}
                </CardDescription>
              )}
            </div>
            <Badge className={`${difficulty?.bgColor}`}>{difficulty?.label}</Badge>
          </div>
          <div className='flex gap-4 text-sm text-muted-foreground pt-2'>
            <span>
              作成日: {new Date(exercise.created_at).toLocaleDateString('ja-JP')}
            </span>
            <span>種別: {type?.label}</span>
          </div>
        </CardHeader>

        <CardContent>
          <div className={`grid grid-cols-1 gap-6 ${started ? 'md:grid-cols-2' : ''}`}>
            <div>
              <ErrorBoundary fallback={<ErrorState />}>
                <Suspense fallback={<Loading />}>
                  <ExerciseContent
                    contentPromise={useExerciseContentPromise(contentUrl)}
                    reveal={started}
                  />
                </Suspense>
                <div className='flex justify-end gap-2 pt-4'>
                  <Button onClick={() => setStarted(true)} disabled={started}>
                    {started ? '開始済み' : '演習を開始'}
                  </Button>
                </div>
              </ErrorBoundary>
            </div>
            <div>
              {started && (
                <div className='w-full'>
                  <ExerciseTextarea
                    value={summary}
                    onChangeAction={(v) => setSummary(v)}
                    className='mt-0'
                  />
                  <div className='flex justify-end gap-2 pt-4'>
                    <Button onClick={() => {}} disabled={false}>
                      要約を提出
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
