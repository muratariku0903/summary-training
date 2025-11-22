import z from 'zod'
import { sql as dsql } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/client/serverComponentClient'
import {
  Exercise,
  EXERCISE_DIFFICULTY,
  ExerciseDifficulty,
  ExerciseEvaluationRubrics,
  ExerciseType,
  LlmVendor,
} from '../supabase/schema/utils'
import { Result } from '@/types/common'
import { SupabaseClient } from '@supabase/supabase-js'
import { DrizzleDB, getDrizzleDBClient } from '../drizzle/client'
import { ExerciseContent, ExerciseEvaluationDetails } from '@/types/exercise'
import { evaluateAccordingToRubrics } from '../llm/openai'
import {
  exerciseEvaluationDetails,
  exerciseEvaluations,
  exerciseSubmissions,
} from '../drizzle/schema/schema'

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

type GetExerciseWithSingedUrlResponse = {
  exercise: Exercise
  contentUrl: string
}
export async function getExerciseWithSingedUrl(
  id: string,
): Promise<GetExerciseWithSingedUrlResponse> {
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

type GetExerciseParams = {
  id: string
  opt?: {
    client?: SupabaseClient
  }
}
type GetExerciseResponse = {
  exercise: Exercise
}
export async function getExercise(
  params: GetExerciseParams,
): Promise<Result<GetExerciseResponse>> {
  const { id, opt } = params

  try {
    const client = opt?.client ?? (await createClient())

    const { data: exercise, error } = await client
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !exercise) {
      return { success: false, error: error ?? new Error('exercise_not_found') }
    }

    return { success: true, data: { exercise } }
  } catch (e) {
    console.error(`fail fetch exercise, id: ${id}`, e)
    return { success: false, error: new Error(`fail fetch exercise, id: ${id}`) }
  }
}

export type GetLatestRubricsPerPerspectiveParams = {
  exerciseType: ExerciseType
  difficulty: ExerciseDifficulty
  opt?: {
    db?: DrizzleDB
  }
}
export type GetLatestRubricsPerPerspectiveResponse = {
  rubrics: ExerciseEvaluationRubrics[]
}
/**
 * 指定の種別/難易度について、各観点（perspective, perspective_name）ごとの最新versionを取得
 * - DISTINCT ON (perspective, perspective_name) + version DESC
 * - opt.db が指定されない場合は内部でdrizzleクライアントを生成して使用
 */
export async function getLatestRubricsPerPerspective(
  params: GetLatestRubricsPerPerspectiveParams,
): Promise<Result<GetLatestRubricsPerPerspectiveResponse>> {
  const { exerciseType, difficulty, opt } = params

  const client = opt?.db ?? getDrizzleDBClient()

  try {
    const res: ExerciseEvaluationRubrics[] = await client.execute(dsql`
      select distinct on (perspective, perspective_name)
        version, exercise_type, difficulty, perspective, perspective_name, detail, weight
      from exercise_evaluation_rubrics
      where exercise_type = ${exerciseType}
        and difficulty = ${difficulty}
      order by perspective, perspective_name, version desc
    `)
    if (!res.length) {
      return { success: false, error: new Error('rubrics_not_found') }
    }

    return { success: true, data: { rubrics: res } }
  } catch (e) {
    console.error('fail fetch rubrics per perspective', e)
    return { success: false, error: new Error('fail_fetch_rubrics') }
  }
}

type EvaluateByLlmParams = {
  input: string
  exercise: Exercise
  exerciseBody: string
  rubrics: ExerciseEvaluationRubrics[]
  vendor?: LlmVendor
}
type EvaluateByLlmResponse = {
  score: number
  evaluatedDetails: ExerciseEvaluationDetails['details']
  evaluatedBy: { vendor: LlmVendor; model: string }
}
export async function evaluateSubmissionByLlm(
  params: EvaluateByLlmParams,
): Promise<Result<EvaluateByLlmResponse>> {
  const { input, exercise, exerciseBody, rubrics, vendor = 'openai' } = params

  switch (vendor) {
    case 'openai': {
      const { data: evaluatedData, error: evaluatedError } =
        await evaluateAccordingToRubrics({ input, exercise, exerciseBody, rubrics })
      if (evaluatedError) {
        console.error('evaluate error', evaluatedError)
        throw Error('evaluate error', evaluatedError)
      }

      return {
        success: true,
        data: {
          score: calculateScoreByEvaluationPerspectiveWeight(
            rubrics,
            evaluatedData.details,
          ),
          evaluatedDetails: evaluatedData.details,
          evaluatedBy: evaluatedData.evaluatedBy,
        },
      }
    }

    default:
      return {
        success: false,
        error: new Error('unsupported exercise evaluate vendor'),
      }
  }
}
function calculateScoreByEvaluationPerspectiveWeight(
  rubrics: ExerciseEvaluationRubrics[],
  details: ExerciseEvaluationDetails['details'],
) {
  let totalSatisfyRubrics = 0
  rubrics.map((r) => {
    const satisfyRate = details.find((d) => d.perspective === r.perspective)?.rate
    if (!satisfyRate) {
      console.warn('miss match between rubrics and evaluate perspective')
      return
    }
    totalSatisfyRubrics += r.weight * satisfyRate
  })
  const totalWeight = rubrics.reduce((sum, r) => sum + (r.weight ?? 0), 0)

  const score = Math.round((totalSatisfyRubrics / totalWeight) * 100)

  return score
}

type GetExerciseContentParams = {
  storagePath: string
  opt?: {
    client?: SupabaseClient
  }
}
type GetExerciseContentResponse = {
  content: ExerciseContent
}
/**
 * Supabase Storage から演習本文を取得
 * - opt.client が指定されない場合は内部でクライアントを生成
 */
export async function getExerciseContent(
  params: GetExerciseContentParams,
): Promise<Result<GetExerciseContentResponse>> {
  const { storagePath, opt } = params

  try {
    const client = opt?.client ?? (await createClient())

    const { data: storageData, error: storageError } = await client.storage
      .from('exercises')
      .download(storagePath)
    if (storageError || !storageData) {
      return {
        success: false,
        error: storageError ?? new Error('exercise_body_not_found'),
      }
    }

    // Blobをテキストに変換
    const text = await storageData.text()
    const content: ExerciseContent = JSON.parse(text)

    return { success: true, data: { content } }
  } catch (e) {
    console.error(`fail fetch exercise body, path: ${storagePath}`, e)
    return {
      success: false,
      error: new Error(`fail fetch exercise body, path: ${storagePath}`),
    }
  }
}

type SaveEvaluationResultParams = {
  exerciseId: string
  userId: string
  input: string
  score: number
  evaluatedBy: { vendor: LlmVendor; model: string }
  evaluatedDetails: ExerciseEvaluationDetails['details']
  rubrics: ExerciseEvaluationRubrics[]
  opt?: {
    db?: DrizzleDB
  }
}
type SaveEvaluationResultResponse = {
  submissionId: string
  evaluationId: string
}
/**
 * 評価結果をDBに保存（トランザクション）
 * - submission/evaluation/details を同一トランザクション内で作成
 * - どれか1つでも失敗したら全体をロールバック
 * - opt.db が指定されない場合は内部でdrizzleクライアントを生成
 */
export async function saveEvaluationResult(
  params: SaveEvaluationResultParams,
): Promise<Result<SaveEvaluationResultResponse>> {
  const {
    exerciseId,
    userId,
    input,
    score,
    evaluatedBy,
    evaluatedDetails,
    rubrics,
    opt,
  } = params

  const client = opt?.db ?? getDrizzleDBClient()

  try {
    const { submissionId, evaluationId } = await client.transaction(async (tx) => {
      // 1) submission作成
      const [subRes] = await tx
        .insert(exerciseSubmissions)
        .values({
          exerciseId,
          userId,
          payload: input,
        })
        .returning({ id: exerciseSubmissions.id })
      const submissionId = subRes?.id
      if (!submissionId) throw new Error('failed to insert submission')

      // 2) evaluation作成（rubricsの最大versionを格納）
      const [evalRes] = await tx
        .insert(exerciseEvaluations)
        .values({
          submissionId,
          status: 'succeeded',
          score: score.toString(),
          feedback: {},
          evaluatedVendor: evaluatedBy.vendor,
          evaluatedModel: evaluatedBy.model,
        })
        .returning({ id: exerciseEvaluations.id })
      const evaluationId = evalRes?.id
      if (!evaluationId) throw new Error('failed to insert evaluation')

      // 3) evaluation_details一括作成
      const insertDetails = evaluatedDetails.map((detail) => {
        const rubric = rubrics.find(
          (r) =>
            r.perspective === detail.perspective &&
            r.perspective_name === detail.perspectiveName,
        )

        return {
          evaluationId: evaluationId,
          perspective: detail.perspective,
          perspectiveName: detail.perspectiveName,
          perspectiveSatisfyRate: detail.rate.toString(),
          reason: detail.reason,
          rubric: {
            perspective: rubric?.perspective,
            perspective_name: rubric?.perspective_name,
            detail: rubric?.detail,
            weight: rubric?.weight,
            version: rubric?.version,
            exercise_type: rubric?.exercise_type,
            difficulty: rubric?.difficulty,
          },
        }
      })

      await tx.insert(exerciseEvaluationDetails).values(insertDetails)

      return { submissionId, evaluationId }
    })

    return { success: true, data: { submissionId, evaluationId } }
  } catch (e) {
    console.error('transaction insert error', e)
    return {
      success: false,
      error: new Error('failed to save evaluation results'),
    }
  }
}
