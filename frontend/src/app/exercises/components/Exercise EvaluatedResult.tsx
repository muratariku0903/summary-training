import { ExerciseSubmissionsResponse } from '@/app/api/exercises/[exercise_id]/submissions/schema'
import React from 'react'

type ExerciseEvaluationResultParams = {
  result: ExerciseSubmissionsResponse
}

export function ExerciseEvaluationResult({ result }: ExerciseEvaluationResultParams) {
  const scoreP = Math.min(100, Math.max(0, toPercent(result.score)))
  const scoreColor = colorByPercent(scoreP)

  return (
    <div className={`mt-6 rounded-lg border`}>
      <div className={`p-4 border-b  flex items-center justify-between`}>
        <div className='space-y-1'>
          <div className='text-lg font-semibold'>評価結果</div>
        </div>
      </div>
      <div className='p-4 space-y-4'>
        {/* 総合スコア表示 */}
        <div
          className={`rounded-md p-3 ${scoreColor.bgSoft} flex items-end justify-between`}
        >
          <div className='space-y-1'>
            <div className='text-sm text-muted-foreground'>総合スコア</div>
            <div className={`text-2xl font-bold ${scoreColor.text}`}>
              {result.score}点
            </div>
          </div>
          <div className='w-40'>
            <div className='w-full h-2 rounded bg-gray-200'>
              <div
                className={`h-2 rounded ${scoreColor.bar}`}
                style={{ width: `${scoreP}%` }}
                aria-label='total-score'
              />
            </div>
          </div>
        </div>

        {/* 詳細 */}
        <div className='space-y-3'>
          {result.evaluatedDetails.map((d, i) => {
            const rateP = Math.min(100, Math.max(0, toPercent(d.rate)))
            const c = colorByPercent(rateP)
            return (
              <div
                key={`${d.perspective}-${i}`}
                className={`rounded-md border ${c.border}`}
              >
                <div className='p-3 flex items-center justify-between'>
                  <div className='font-medium'>{d.perspectiveName}</div>
                  <div className={`text-sm font-semibold ${c.text}`}>
                    {rateP.toFixed(1)}%
                  </div>
                </div>
                <div className='px-3 pb-3'>
                  <div className='w-full h-2 rounded bg-gray-200'>
                    <div
                      className={`h-2 rounded ${c.bar}`}
                      style={{ width: `${rateP}%` }}
                      aria-label={`rate-${i}`}
                    />
                  </div>
                  <div className='mt-2 text-sm text-muted-foreground'>{d.reason}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const toPercent = (v: number) => (v <= 1 ? v * 100 : v)

const colorByPercent = (p: number) => {
  if (p >= 80) {
    return {
      border: 'border-green-500',
      text: 'text-green-700',
      bgSoft: 'bg-green-50',
      bar: 'bg-green-500',
      badge: 'bg-green-100 text-green-800',
    }
  }
  if (p >= 60) {
    return {
      border: 'border-amber-500',
      text: 'text-amber-700',
      bgSoft: 'bg-amber-50',
      bar: 'bg-amber-500',
      badge: 'bg-amber-100 text-amber-800',
    }
  }
  return {
    border: 'border-rose-500',
    text: 'text-rose-700',
    bgSoft: 'bg-rose-50',
    bar: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-800',
  }
}
