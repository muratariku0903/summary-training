import { useMemo } from 'react'

/**
 * Suspense 用: コンテンツ取得の Promise を返すフック
 * 同一 URL はメモリキャッシュで再利用
 */
export interface ExerciseContent {
  title: string
  description: string
  difficulty: string
  body: string
}
export const useExerciseContentPromise = (
  contentUrl: string,
): Promise<ExerciseContent> => {
  return useMemo(() => fetchExerciseContent(contentUrl), [contentUrl])
}

const fetchExerciseContent = async (url: string): Promise<ExerciseContent> => {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('コンテンツの取得に失敗しました')
  const json = (await res.json()) as ExerciseContent
  console.log('json: ', json)

  return json
}
