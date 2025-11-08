import z from 'zod'
import { createClient } from '@/lib/supabase/client/serverComponentClient'
import { Exercise, EXERCISE_DIFFICULTY } from '../supabase/schema/utils'

const ITEMS_PER_PAGE = 10

export const searchExercisesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  title: z.string().optional(),
  description: z.string().optional(),
  difficulty: z
    .union([z.enum(EXERCISE_DIFFICULTY), z.array(z.enum(EXERCISE_DIFFICULTY))])
    .optional()
    .transform((val) => {
      if (!val) return undefined
      return Array.isArray(val) ? val : [val]
    }),
  createdAtFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  createdAtTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})
export type SearchExercisesParams = z.infer<typeof searchExercisesSchema>

type SearchExercisesResponse = {
  exercises: Exercise[]
  totalCount: number
  currentPage: number
  totalPages: number
}
export async function searchExercises(
  params: SearchExercisesParams,
): Promise<SearchExercisesResponse> {
  const { page, title, description, difficulty, createdAtFrom, createdAtTo } = params

  const serverComponentClient = await createClient()

  // ページネーションの計算
  const from = (page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  // クエリの構築
  let query = serverComponentClient.from('exercises').select('*', { count: 'exact' })

  // タイトルで部分一致検索
  if (title) {
    query = query.ilike('title', `%${title}%`)
  }

  // 説明で部分一致検索
  if (description) {
    query = query.ilike('description', `%${description}%`)
  }

  // 難易度で検索（複数選択対応）
  if (difficulty && difficulty.length > 0) {
    query = query.in('difficulty', difficulty)
  }

  // 作成日で範囲検索
  if (createdAtFrom) {
    const startDate = new Date(createdAtFrom)
    startDate.setHours(0, 0, 0, 0)
    query = query.gte('created_at', startDate.toISOString())
  }

  if (createdAtTo) {
    const endDate = new Date(createdAtTo)
    endDate.setHours(23, 59, 59, 999)
    query = query.lte('created_at', endDate.toISOString())
  }

  // 総件数を取得
  const { count } = await query
  // データを取得（ソートとページネーション）
  const { data: exercises, error } = await query
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

type GetExerciseResponse = {
  exercise: Exercise
  contentUrl: string
}
export async function getExercise(id: string): Promise<GetExerciseResponse> {
  const serverComponentClient = await createClient()

  // DBから演習データを取得
  const { data: exercise, error: dbError } = await serverComponentClient
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single()
  if (dbError || !exercise) {
    console.error('演習取得エラー:', dbError)
    throw new Error('演習の取得に失敗しました')
  }

  // 署名付きURLを生成（1時間有効）
  const { data: signedUrlData, error: signedUrlError } =
    await serverComponentClient.storage
      .from('exercises')
      .createSignedUrl(exercise.storage_path, 60 * 5)
  if (signedUrlError || !signedUrlData) {
    console.error('署名付きURL生成エラー:', signedUrlError)
    throw new Error('コンテンツURLの生成に失敗しました')
  }

  return { exercise, contentUrl: signedUrlData.signedUrl }
}
