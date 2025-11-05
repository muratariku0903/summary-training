'use client'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Exercise as ExerciseType } from '@/lib/supabase/schema/utils'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ExerciseProps {
  exercise: ExerciseType
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '初級',
  medium: '中級',
  hard: '上級',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
}

export function Exercise({ exercise }: ExerciseProps) {
  const router = useRouter()

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
            <Badge className={DIFFICULTY_COLORS[exercise.difficulty]}>
              {DIFFICULTY_LABELS[exercise.difficulty]}
            </Badge>
          </div>
          <div className='flex gap-4 text-sm text-muted-foreground pt-2'>
            <span>
              作成日: {new Date(exercise.created_at).toLocaleDateString('ja-JP')}
            </span>
            <span>種別: {exercise.exercise_type}</span>
          </div>
        </CardHeader>
        {/* <CardContent>
          <div className='prose max-w-none'>
            <div className='whitespace-pre-wrap bg-muted p-6 rounded-lg'></div>
          </div>
        </CardContent> */}
      </Card>

      <div className='flex justify-end gap-2'>
        <Button>演習を開始</Button>
      </div>
    </div>
  )
}
