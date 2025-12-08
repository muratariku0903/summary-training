import z from 'zod'
import { sql as dsql } from 'drizzle-orm'
import {
  Exercise,
  EXERCISE_DIFFICULTY,
  ExerciseDifficulty,
  ExerciseEvaluationRubrics,
  ExerciseType,
  LlmVendor,
} from '../../supabase/schema/utils'
import { Result } from '@/types/common'
import { SupabaseClient } from '@supabase/supabase-js'
import { DrizzleDB, getDrizzleDBClient } from '../../drizzle/client'
import { ExerciseContent, ExerciseEvaluationDetails } from '@/types/exercise'
import { evaluateAccordingToRubrics } from '../../llm/openai/server'
import {
  exerciseEvaluationDetails,
  exerciseEvaluations,
  exerciseSubmissions,
} from '../../drizzle/schema/schema'
import { getRequestLogger } from '../../log/storage'
import { createServerComponentClient } from '@/lib/supabase/client/serverComponentClient'

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
  const logger = getRequestLogger()

  const serverComponentClient = await createServerComponentClient()

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
    logger.error('Failed to search exercises', error)
    throw new Error('課題の取得に失敗しました')
  }

  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  logger.debug('Exercises search completed', {
    totalCount,
    currentPage: page,
    totalPages,
    resultCount: exercises?.length || 0,
  })

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
  const logger = getRequestLogger()
  logger.debug('Fetching exercise with signed URL', { exerciseId: id })

  const serverComponentClient = await createServerComponentClient()

  // DBから演習データを取得
  const { data: exercise, error: dbError } = await serverComponentClient
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single()
  if (dbError || !exercise) {
    logger.error('Failed to fetch exercise', dbError)
    throw new Error('演習の取得に失敗しました')
  }
  logger.info('Exercise fetched, generating signed URL', {
    storagePath: exercise.storage_path,
  })
  // logger.debug('Exercise fetched, generating signed URL', {
  //   storagePath: exercise.storage_path,
  // })

  // 署名付きURLを生成（1時間有効）
  const { data: signedUrlData, error: signedUrlError } =
    await serverComponentClient.storage
      .from('exercises')
      .createSignedUrl(exercise.storage_path, 60 * 5)
  if (signedUrlError || !signedUrlData) {
    logger.error('Failed to generate signed URL', signedUrlError)
    throw new Error('コンテンツURLの生成に失敗しました')
  }
  logger.debug('Signed URL generated successfully')

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
  const logger = getRequestLogger()

  try {
    const client = opt?.client ?? (await createServerComponentClient())

    const { data: exercise, error } = await client
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !exercise) {
      logger.error('Failed to fetch exercise', error, { exerciseId: id })
      return { success: false, error: error ?? new Error('exercise_not_found') }
    }

    logger.debug('Exercise fetched successfully', {
      exerciseId: id,
      exerciseType: exercise.exercise_type,
      difficulty: exercise.difficulty,
    })

    return { success: true, data: { exercise } }
  } catch (e) {
    logger.error('Unexpected error in getExercise', e, { exerciseId: id })
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
  const logger = getRequestLogger()

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
      logger.warn('No rubrics found', { exerciseType, difficulty })
      return { success: false, error: new Error('rubrics_not_found') }
    }

    logger.debug('Rubrics fetched successfully', {
      exerciseType,
      difficulty,
      rubricsCount: res.length,
    })

    return { success: true, data: { rubrics: res } }
  } catch (e) {
    logger.error('Failed to fetch rubrics per perspective', e, {
      exerciseType,
      difficulty,
    })
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
  const logger = getRequestLogger()

  logger.info('Starting LLM evaluation', {
    vendor,
    exerciseId: exercise.id,
    rubricsCount: rubrics.length,
  })

  switch (vendor) {
    case 'openai': {
      logger.debug('Calling OpenAI evaluation API')
      const { data: evaluatedData, error: evaluatedError } =
        await evaluateAccordingToRubrics({ input, exercise, exerciseBody, rubrics })
      if (evaluatedError) {
        logger.error('OpenAI evaluation failed', evaluatedError)
        throw Error('evaluate error', evaluatedError)
      }

      const score = calculateScoreByEvaluationPerspectiveWeight(
        rubrics,
        evaluatedData.details,
      )

      logger.info('LLM evaluation completed successfully', {
        vendor,
        model: evaluatedData.evaluatedBy.model,
        score,
      })

      return {
        success: true,
        data: {
          score,
          evaluatedDetails: evaluatedData.details,
          evaluatedBy: evaluatedData.evaluatedBy,
        },
      }
    }

    default:
      logger.error('Unsupported LLM vendor', new Error('unsupported vendor'), {
        vendor,
      })
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
  const logger = getRequestLogger()

  let totalSatisfyRubrics = 0
  rubrics.map((r) => {
    const satisfyRate = details.find((d) => d.perspective === r.perspective)?.rate
    if (!satisfyRate) {
      logger.warn('Mismatch between rubrics and evaluate perspective', {
        rubricPerspective: r.perspective,
      })
      return
    }
    totalSatisfyRubrics += r.weight * satisfyRate
  })
  const totalWeight = rubrics.reduce((sum, r) => sum + (r.weight ?? 0), 0)
  const score = Math.round((totalSatisfyRubrics / totalWeight) * 100)

  logger.debug('Score calculated', {
    totalSatisfyRubrics,
    totalWeight,
    score,
  })

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
  const logger = getRequestLogger()

  try {
    const client = opt?.client ?? (await createServerComponentClient())

    const { data: storageData, error: storageError } = await client.storage
      .from('exercises')
      .download(storagePath)
    if (storageError || !storageData) {
      logger.error('Failed to download exercise content', storageError, {
        storagePath,
      })
      return {
        success: false,
        error: storageError ?? new Error('exercise_body_not_found'),
      }
    }

    logger.debug('Exercise content downloaded, parsing JSON')

    // Blobをテキストに変換
    const text = await storageData.text()
    const content: ExerciseContent = JSON.parse(text)

    logger.debug('Exercise content parsed successfully')

    return { success: true, data: { content } }
  } catch (e) {
    logger.error('Unexpected error in getExerciseContent', e, { storagePath })
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
  const logger = getRequestLogger()

  const client = opt?.db ?? getDrizzleDBClient()

  try {
    const { submissionId, evaluationId } = await client.transaction(async (tx) => {
      // 1) submission作成
      logger.debug('Inserting submission record')
      const [subRes] = await tx
        .insert(exerciseSubmissions)
        .values({
          exerciseId,
          userId,
          payload: input,
        })
        .returning({ id: exerciseSubmissions.id })
      const submissionId = subRes?.id
      if (!submissionId) {
        logger.error(
          'Failed to insert submission',
          new Error('no submission id returned'),
        )
        throw new Error('failed to insert submission')
      }

      logger.debug('Submission created', { submissionId })

      // 2) evaluation作成（rubricsの最大versionを格納）
      logger.debug('Inserting evaluation record')
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
      if (!evaluationId) {
        logger.error(
          'Failed to insert evaluation',
          new Error('no evaluation id returned'),
        )
        throw new Error('failed to insert evaluation')
      }

      logger.debug('Evaluation created', { evaluationId })

      // 3) evaluation_details一括作成
      logger.debug('Inserting evaluation details', {
        detailsCount: evaluatedDetails.length,
      })
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

      logger.debug('Evaluation details inserted successfully')

      return { submissionId, evaluationId }
    })

    logger.info('Evaluation result saved successfully', {
      submissionId,
      evaluationId,
      score,
    })

    return { success: true, data: { submissionId, evaluationId } }
  } catch (e) {
    logger.error('Transaction failed while saving evaluation results', e, {
      exerciseId,
      userId,
    })
    return {
      success: false,
      error: new Error('failed to save evaluation results'),
    }
  }
}
