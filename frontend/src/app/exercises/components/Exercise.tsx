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
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EXERCISE_DIFFICULTIES, EXERCISE_TYPES, UI_MESSAGES } from '@/lib/constants/ui'
import Loading from '@/components/elements/loading/Loading'
import { ExerciseContent } from './ExerciseContent'
import { ErrorBoundary } from 'react-error-boundary'
import { useExerciseContentPromise } from '@/hooks/exercise'
import ErrorState from '@/components/elements/error-state/ErrorState'
import ExerciseTextarea from './ExerciseTextarea'
import { request } from '@/lib/api/client'
import { ExerciseEvaluationResult } from './Exercise EvaluatedResult'
import { ExerciseSubmissionsResponse } from '@/app/api/exercises/[exercise_id]/submissions/schema'
import {
  MessageType,
  OutlineMessage,
} from '@/components/elements/outline-message/OutlineMessage'

interface ExerciseProps {
  exercise: ExerciseType
  contentUrl: string
}

export function Exercise({ exercise, contentUrl }: ExerciseProps) {
  const router = useRouter()
  const [started, setStarted] = useState(false)
  const [summary, setSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ExerciseSubmissionsResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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
                    <Button
                      onClick={async () => {
                        setSubmitting(true)
                        setResult(null)
                        const { success, data, error } = await request(
                          `/exercises/${exercise.id}/submissions`,
                          'post',
                          {
                            input: summary,
                          },
                          { requireAuth: true },
                        )
                        if (!success) {
                          console.error('evaluate error: ', error)
                          setSubmitting(false)
                          setErrorMsg(UI_MESSAGES.SERVER_ERROR)
                          return
                        }

                        console.log('evaluated data: ', data)
                        setResult({
                          evaluationId: data.evaluationId,
                          score: data.score,
                          evaluatedDetails: data.evaluatedDetails,
                        })
                        setSubmitting(false)
                      }}
                      disabled={submitting || !summary.trim()}
                    >
                      {submitting ? (
                        <span className='inline-flex items-center gap-2'>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          評価中…
                        </span>
                      ) : (
                        '要約を提出'
                      )}
                    </Button>
                  </div>
                  {submitting && (
                    <div className='mt-3 flex items-center text-sm text-muted-foreground'>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      評価中です。しばらくお待ちください…
                    </div>
                  )}
                  {/* エラー表示（ユーザー向け・コードのみ露出） */}
                  {errorMsg && (
                    <div className='mt-3'>
                      <OutlineMessage message={errorMsg} type={MessageType.ERROR} />
                    </div>
                  )}
                  {result && <ExerciseEvaluationResult result={result} />}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
