import { clientLogger } from '@/stores/useClientLoggerStore'
import { ExerciseContent } from '@/types/exercise'
import { useMemo } from 'react'

/**
 * Suspense 用: コンテンツ取得の Promise を返すフック
 * 同一 URL はメモリキャッシュで再利用
 */
export const useExerciseContentPromise = (
  contentUrl: string,
): Promise<ExerciseContent> => {
  return useMemo(() => fetchExerciseContent(contentUrl), [contentUrl])
}

const fetchExerciseContent = async (url: string): Promise<ExerciseContent> => {
  clientLogger.info('Fetching exercise content', { contentUrl: url })
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    clientLogger.error(
      'Failed to fetch exercise content',
      new Error(`HTTP ${res.status}`),
      {
        contentUrl: url,
        status: res.status,
        statusText: res.statusText,
      },
    )
    throw new Error('コンテンツの取得に失敗しました')
  }
  const json = (await res.json()) as ExerciseContent

  clientLogger.info('Exercise content fetched successfully', {
    contentUrl: url,
    contentSize: JSON.stringify(json).length,
  })

  return json
}
