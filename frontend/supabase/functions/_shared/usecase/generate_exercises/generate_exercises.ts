import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '../../../_shared/types/database.ts'
import { LlmExerciseGeneratorResponse, Result } from '../../types/common.ts'
import { ExerciseGeneratorProfile } from '../../repository/exercise_generator_profiles.ts'
import { run } from '../../db/process.ts'
import { POOL } from '../../db/client.ts'
import { SQL_PICK_RANDOM_UNUSED_SOURCE_PATTERN } from './sql.ts'
import { generateExercise as generateExerciseByOpenAI } from '../../openai/functions/generate_exercise.ts'
import { ymdJST } from '../../utils/utils.ts'
import { ExercisesInsertRow } from '../../types/exercises.ts'
import { logger } from '../../log/log.ts'

/**
 * プロファイルIDから設定情報を完全取得するレスポンス型
 * - プロファイル基本情報
 * - 出力設定（output_config）
 * - スキーマ定義（schema）
 * - LLM情報（llm）
 */
type GenerateExerciseOutputConfigByProfileIdResponse =
  | (ExerciseGeneratorProfile & {
      output_config: Tables<'exercise_generator_output_configs'> & {
        schema: Tables<'exercise_generator_output_configs_schemas'> & {
          llm: Tables<'llms'>
        }
      }
    })
  | null
export async function resolveOutputConfigByProfileId(
  supabase: SupabaseClient<Database>,
  profileId: string,
): Promise<Result<GenerateExerciseOutputConfigByProfileIdResponse>> {
  logger.start(resolveOutputConfigByProfileId.name)

  // まずプロファイルと設定を取得
  const { data: profileData, error: profileError } = await supabase
    .from('exercise_generator_profiles')
    .select(
      `
      *,
      output_config:exercise_generator_output_configs(*)
    `,
    )
    .eq('id', profileId)
    .single()

  if (profileError) {
    if (profileError.code === 'PGRST116') {
      return { success: true, data: null }
    }
    return { success: false, error: profileError }
  }

  // 手動で複合キーを使ってスキーマを取得
  const { data: schemaData, error: schemaError } = await supabase
    .from('exercise_generator_output_configs_schemas')
    .select(
      `
      *,
      llm:llms(*)
    `,
    )
    .eq('llm_id', profileData.output_config.llm_id)
    .eq('data_type', profileData.output_config.data_type)
    .eq('exercise_type', profileData.output_config.exercise_type)
    .eq('difficulty', profileData.output_config.difficulty)
    .single()

  if (schemaError) {
    if (schemaError.code === 'PGRST116') {
      return { success: true, data: null }
    }
    return { success: false, error: schemaError }
  }

  // 結果を組み立て
  const result = {
    ...profileData,
    output_config: {
      ...profileData.output_config,
      schema: schemaData,
    },
  }
  logger.end(resolveOutputConfigByProfileId.name)

  return { success: true, data: result }
}

/**
 * プロファイルIDに基づいてソースを解決する関数
 *
 * 1. 既存の関連ソースをチェック
 * 2. 見つからない場合は未使用パターンを選択
 * 3. パターンからソースの詳細情報を取得
 */
type ResolveSourcesParams = {
  supabase: SupabaseClient<Database>
  profileId: string
  sourceCombMin: number
  sourceCombMax: number
  allowRepeatWhenExhausted: boolean
}
type ResolveSourcesResponse = Tables<'exercise_generator_sources'>[]
export const resolveSourcesByProfileId = async (
  params: ResolveSourcesParams,
): Promise<Result<ResolveSourcesResponse>> => {
  logger.start(resolveSourcesByProfileId.name)

  const { supabase, profileId, sourceCombMin, sourceCombMax, allowRepeatWhenExhausted } =
    params
  const { data: sourcesData, error: sourcesError } = await supabase
    .from('exercise_generator_profile_sources')
    .select(
      `
      source_id,
      source:exercise_generator_sources(*)
    `,
    )
    .eq('profile_id', profileId)
  if (sourcesError) {
    return { success: false, error: sourcesError }
  }
  if (sourcesData.length > 0) {
    return { success: true, data: sourcesData.map((e) => e.source) }
  }

  // ソースが決定しない場合はランダムでソースを取得
  logger.debug('pick random sources')
  const {
    success: runSuccess,
    data: runData,
    error: runError,
  } = await run({
    pool: POOL,
    exec: async (client) => {
      const result = await client.queryObject<{
        source_ids: string[]
      }>(SQL_PICK_RANDOM_UNUSED_SOURCE_PATTERN, [
        profileId,
        sourceCombMin,
        sourceCombMax,
        10,
        allowRepeatWhenExhausted,
      ])

      return result.rows
    },
  })
  if (!runSuccess) {
    console.error('fail pick random sources')
    return { success: false, error: Error(runError.message) }
  }
  if (!runData || runData.length === 0) {
    console.error('fail pick random sources')
    return {
      success: false,
      error: Error('fail resolve sources, maybe cannot find unique source pattern'),
    }
  }

  const sourceIds = runData[0].source_ids
  console.log('sourceIds: ', sourceIds)

  const { data: sourceRecords, error: sourceRecordsError } = await supabase
    .from('exercise_generator_sources')
    .select('*')
    .in('id', sourceIds)
  if (sourceRecordsError) {
    return { success: false, error: sourceRecordsError }
  }

  return { success: true, data: sourceRecords }
}

/**
 * ソースから題材を生成
 *
 * 1. ソースID群から関連するseed（元データ）を取得
 * 2. seedの生テキストをLLMに渡して題材を生成
 * 3. LLMベンダー（OpenAI/Claude等）に応じた生成処理を実行
 *
 * @param params 生成に必要なパラメータ（ソース、LLM設定、スキーマ）
 * @returns 生成された題材データまたはエラー
 */
type GenerateExerciseByLlmFromSourcesParams = {
  supabase: SupabaseClient<Database>
  sources: Tables<'exercise_generator_sources'>[]
  llm: Tables<'llms'>
  schema: Tables<'exercise_generator_output_configs_schemas'>
}
type GenerateExerciseByLlmFromSourcesResponse = LlmExerciseGeneratorResponse
export const generateExerciseByLlmFromSourcesParams = async (
  params: GenerateExerciseByLlmFromSourcesParams,
): Promise<Result<GenerateExerciseByLlmFromSourcesResponse>> => {
  const {
    supabase,
    sources,
    llm: { vendor, model, max_tokens },
    schema: { schema },
  } = params

  const sourceIds = sources.map((source) => source.id)

  // Step 1: source_seed関係を取得
  const { data: sourceSeedsData, error: sourceSeedsError } = await supabase
    .from('exercise_generator_source_seeds')
    .select('*')
    .in('source_id', sourceIds)
  if (sourceSeedsError) {
    return { success: false, error: sourceSeedsError }
  }
  if (!sourceSeedsData || sourceSeedsData.length === 0) {
    return {
      success: false,
      error: new Error(
        `No seed relationships found for sources: ${sourceIds.join(', ')}`,
      ),
    }
  }

  // Step 2: seed_idを抽出
  const seedIds = sourceSeedsData.map((item) => item.seed_id)

  // Step 3: seedデータを取得
  const { data: seedsData, error: seedsError } = await supabase
    .from('exercise_generator_seeds')
    .select('*')
    .in('id', seedIds)
    .eq('status', 'active')
  if (seedsError) {
    return { success: false, error: seedsError }
  }

  // Step 4: LLMから題材データを生成
  switch (vendor) {
    case 'openai': {
      const { success, data, error } = await generateExerciseByOpenAI({
        schema,
        model: { name: model, max_tokens },
        sources: seedsData.map((s) => s.raw_text ?? ''),
      })
      if (!success) {
        return { success: false, error: Error(error.message) }
      }

      return { success: true, data: data }
    }

    default:
      return {
        success: false,
        error: new Error(`unsupported llm vendor: ${vendor}`),
      }
  }
}

/**
 * 生成された題材をDBとストレージに保存する関数
 *
 * 処理フロー：
 * 1. DBに題材メタデータを保存
 * 2. ストレージに題材の詳細データ（JSON）を保存
 * 3. ストレージ保存失敗時はDBレコードを論理削除
 *
 * @param params 保存に必要なパラメータ
 * @returns 保存結果またはエラー
 */
type SaveGeneratedExerciseParams = {
  supabase: SupabaseClient<Database>
  exercise: {
    title: string
    difficulty: Database['public']['Enums']['difficulty_level']
    description: string
    body: string
  }
  exerciseType: Database['public']['Enums']['exercise_type']
  profileId: string
}

type SaveGeneratedExerciseResponse = {
  exerciseId: string
  storagePath: string
  exercise: Tables<'exercises'>
}
export const saveGeneratedExercise = async (
  params: SaveGeneratedExerciseParams,
): Promise<Result<SaveGeneratedExerciseResponse>> => {
  const { supabase, exercise, exerciseType, profileId } = params

  // Step 1: ストレージパスの生成
  const { yyyy, mm, dd } = ymdJST()
  const exerciseId = crypto.randomUUID()
  const storagePath = `${exerciseType}/${yyyy}/${mm}/${dd}/${exerciseId}/index.json`

  // Step 2: DBに題材メタデータを保存
  const insertParams: ExercisesInsertRow = {
    status: 'ready',
    exercise_type: exerciseType,
    create_type: 'system',
    difficulty: exercise.difficulty,
    title: exercise.title,
    description: exercise.description,
    storage_path: storagePath,
    generate_profile_id: profileId,
  }
  const { data: dbData, error: dbError } = await supabase
    .from('exercises')
    .insert(insertParams)
    .select('*')
    .single()
  if (dbError) {
    return {
      success: false,
      error: new Error(`DB保存に失敗しました: ${dbError.message}`),
    }
  }

  // Step 3: ストレージに題材の詳細データを保存
  const payload = JSON.stringify(exercise, null, 2)
  const { error: storageError } = await supabase.storage
    .from('exercises')
    .upload(storagePath, new Blob([payload], { type: 'application/json' }), {
      upsert: true,
    })
  if (storageError) {
    // Step 4: ストレージ保存失敗時はDBレコードを論理削除
    const { error: deleteError } = await supabase
      .from('exercises')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', exerciseId)
    if (deleteError) {
      console.error('論理削除にも失敗しました:', deleteError)
      return {
        success: false,
        error: new Error(
          `ストレージ保存失敗 & 論理削除失敗: Storage: ${storageError.message}, Delete: ${deleteError.message}`,
        ),
      }
    }

    return {
      success: false,
      error: new Error(
        `ストレージ保存に失敗しました（DBレコードは論理削除済み）: ${storageError.message}`,
      ),
    }
  }

  // Step 5: 成功時のレスポンス
  return {
    success: true,
    data: {
      exerciseId: dbData.id,
      storagePath: storagePath,
      exercise: dbData,
    },
  }
}
