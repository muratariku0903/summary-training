import { createClient } from '@/lib/supabase/client/serverComponentClient'
import { Exercise } from '../supabase/schema/utils'

const ITEMS_PER_PAGE = 20

type SearchExercisesParams = {
  page: number
}
type SearchExercisesResponse = {
  exercises: Exercise[]
  totalCount: number
  currentPage: number
  totalPages: number
}
export async function searchExercises(
  params: SearchExercisesParams,
): Promise<SearchExercisesResponse> {
  const { page } = params

  const serverComponentClient = await createClient()

  // ページネーションの計算
  const from = (page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  // 総件数を取得
  const { count } = await serverComponentClient
    .from('exercises')
    .select('*', { count: 'exact', head: true })

  // データを取得
  const { data: exercises, error } = await serverComponentClient
    .from('exercises')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('課題取得エラー:', error)
    throw new Error('課題の取得に失敗しました')
  }

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return {
    exercises: exercises || [],
    totalCount,
    currentPage: page,
    totalPages,
  }
}
