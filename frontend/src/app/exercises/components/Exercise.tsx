'use client'

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
import { Suspense } from 'react'
import Loading from '@/components/elements/loading/Loading'
import { ExerciseContent } from './ExerciseContent'
import { ErrorBoundary } from 'react-error-boundary'
import { useMemo } from 'react'

interface ExerciseProps {
  exercise: ExerciseType
  contentUrl: string
}

export function Exercise({ exercise, contentUrl }: ExerciseProps) {
  const router = useRouter()
  const difficulty = EXERCISE_DIFFICULTIES.find((d) => d.value === exercise.difficulty)
  const type = EXERCISE_TYPES.find((t) => t.value === exercise.exercise_type)

  // Promiseは親で一度だけ生成し、子へ渡す
  const contentPromise = useMemo(() => fetchExerciseContent(contentUrl), [contentUrl])

  return (
    <div className='w-full max-w-4xl mx-auto space-y-6'>
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
            <Badge className={difficulty?.color}>{difficulty?.label}</Badge>
          </div>
          <div className='flex gap-4 text-sm text-muted-foreground pt-2'>
            <span>
              作成日: {new Date(exercise.created_at).toLocaleDateString('ja-JP')}
            </span>
            <span>種別: {type?.label}</span>
          </div>
        </CardHeader>

        <CardContent>
          <ErrorBoundary fallback={<p>表示中に問題が発生しました。</p>}>
            <Suspense fallback={<Loading />}>
              <ExerciseContent contentPromise={contentPromise} />
            </Suspense>
          </ErrorBoundary>
        </CardContent>
      </Card>

      <div className='flex justify-end gap-2'>
        <Button>演習を開始</Button>
      </div>
    </div>
  )
}

// 外部に純粋なフェッチ関数（キャッシュしない）
async function fetchExerciseContent(url: string): Promise<string> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('コンテンツの取得に失敗しました')
  return res.text()
}
