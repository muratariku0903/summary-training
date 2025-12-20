import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '../../types/db_schema.ts'
import { LlmExerciseGeneratorResponse, Result } from '../../types/common.ts'
import { ExerciseGeneratorProfile } from '../../repository/exercise_generator_profiles.ts'
import { run } from '../../db/process.ts'
import { SQL_PICK_RANDOM_UNUSED_SOURCE_PATTERN } from './sql.ts'
import { generateExercise as generateExerciseByOpenAI } from '../../llm/openai/functions/generate_exercise.ts'
import { ymdJST } from '../../utils/utils.ts'
import { ExercisesInsertRow } from '../../types/exercises.ts'
import { logger } from '../../log/log.ts'
import {
  BaseError,
  DatabaseQueryError,
  DirectlyExecutingQueryError,
  OperationError,
  StorageError,
  UnexpectedError,
} from '../../error/error.ts'
import { ERROR_CODES, STORAGE_OPERATION } from '../../error/code.ts'
import { getPoolClient } from '../../db/client.ts'

/**
 * プロファイルIDから設定情報を完全取得するレスポンス型
 * - プロファイル基本情報
 * - 出力設定（output_config）
 * - スキーマ定義（schema）
 * - LLM情報（llm）
 */
export type GenerateExerciseOutputConfigByProfileIdResponse =
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
): Promise<Result<GenerateExerciseOutputConfigByProfileIdResponse, DatabaseQueryError>> {
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
    return {
      success: false,
      error: new DatabaseQueryError(
        resolveOutputConfigByProfileId.name,
        'SELECT',
        'exercise_generator_profiles',
        profileError.message,
      ),
    }
  }

  // 複合キーを使ってスキーマを取得
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
    return {
      success: false,
      error: new DatabaseQueryError(
        resolveOutputConfigByProfileId.name,
        'SELECT',
        'exercise_generator_output_configs_schemas',
        schemaError.message,
      ),
    }
  }

  // 結果を組み立て
  const result = {
    ...profileData,
    output_config: {
      ...profileData.output_config,
      schema: schemaData,
    },
  }

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
export type ResolveSourcesResponse = {
  patternId: Tables<'exercise_generator_profile_source_patterns'>['id'] | null
  sources: Tables<'exercise_generator_sources'>[]
}
export const resolveSourcesByProfileId = async (
  params: ResolveSourcesParams,
): Promise<
  Result<
    ResolveSourcesResponse,
    DatabaseQueryError | DirectlyExecutingQueryError | OperationError
  >
> => {
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
    return {
      success: false,
      error: new DatabaseQueryError(
        resolveOutputConfigByProfileId.name,
        'SELECT',
        'exercise_generator_profile_sources',
        sourcesError.message,
      ),
    }
  }
  if (sourcesData.length > 0) {
    return {
      success: true,
      data: { patternId: null, sources: sourcesData.map((e) => e.source) },
    }
  }

  // ソースが決定しない場合はランダムでソースを取得
  logger.debug('ソースの指定がないため、ランダムにソースを選択します')
  const {
    success: runSuccess,
    data: runData,
    error: runError,
  } = await run({
    pool: getPoolClient(),
    exec: async (client) => {
      try {
        const result = await client.queryObject<{
          pattern_id: string | null
          source_ids: string[]
        }>(SQL_PICK_RANDOM_UNUSED_SOURCE_PATTERN, [
          profileId,
          sourceCombMin,
          sourceCombMax,
          10,
          allowRepeatWhenExhausted,
        ])

        return { success: true, data: result.rows }
      } catch (e) {
        logger.error('[SQL_PICK_RANDOM_UNUSED_SOURCE_PATTERN]でエラーが発生', e)
        return {
          success: false,
          error: new DirectlyExecutingQueryError(
            resolveSourcesByProfileId.name,
            e,
            SQL_PICK_RANDOM_UNUSED_SOURCE_PATTERN,
          ),
        }
      }
    },
  })
  if (!runSuccess) {
    return { success: false, error: runError }
  }
  if (runData.length === 0) {
    logger.warn('未使用のソースパターンを取得できませんでした')
    return {
      success: false,
      error: new OperationError(
        resolveOutputConfigByProfileId.name,
        ERROR_CODES.UNUSED_SOURCE_PATTERN_NOT_FOUND,
        '未使用のソースパターンを取得できませんでした',
        `profileId: ${profileId}, sourceCombMin: ${sourceCombMin}, sourceCombMax: ${sourceCombMax}, allowRepeatWhenExhausted: ${allowRepeatWhenExhausted}`,
      ),
    }
  }

  const { pattern_id, source_ids } = runData[0]
  logger.debug('sourceIds: ', source_ids)

  const { data: sourceRecords, error: sourceRecordsError } = await supabase
    .from('exercise_generator_sources')
    .select('*')
    .in('id', source_ids)
  if (sourceRecordsError) {
    return {
      success: false,
      error: new DatabaseQueryError(
        resolveOutputConfigByProfileId.name,
        'SELECT',
        'exercise_generator_sources',
        sourceRecordsError.message,
      ),
    }
  }

  return { success: true, data: { patternId: pattern_id, sources: sourceRecords } }
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
export type GenerateExerciseByLlmFromSourcesResponse = LlmExerciseGeneratorResponse
export const generateExerciseByLlmFromSourcesParams = async (
  params: GenerateExerciseByLlmFromSourcesParams,
): Promise<Result<GenerateExerciseByLlmFromSourcesResponse, BaseError>> => {
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
    return {
      success: false,
      error: new DatabaseQueryError(
        generateExerciseByLlmFromSourcesParams.name,
        'SELECT',
        'exercise_generator_source_seeds',
        sourceSeedsError.message,
      ),
    }
  }
  if (!sourceSeedsData || sourceSeedsData.length === 0) {
    return {
      success: false,
      error: new UnexpectedError(
        generateExerciseByLlmFromSourcesParams.name,
        `SOURCEに紐づくSEEDが存在しませんでした: ${sourceIds.join(', ')}`,
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
    return {
      success: false,
      error: new DatabaseQueryError(
        generateExerciseByLlmFromSourcesParams.name,
        'SELECT',
        'exercise_generator_seeds',
        seedsError.message,
      ),
    }
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
        return { success: false, error }
      }

      return { success: true, data: data }
    }

    default:
      return {
        success: false,
        error: new UnexpectedError(
          generateExerciseByLlmFromSourcesParams.name,
          `想定外のLLMベンダが指定されました vendor:${vendor}`,
        ),
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

export type SaveGeneratedExerciseResponse = {
  exerciseId: string
  storagePath: string
  exercise: Tables<'exercises'>
}
export const saveGeneratedExercise = async (
  params: SaveGeneratedExerciseParams,
): Promise<Result<SaveGeneratedExerciseResponse, DatabaseQueryError | StorageError>> => {
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
      error: new DatabaseQueryError(
        saveGeneratedExercise.name,
        'INSERT',
        'exercises',
        dbError.message,
      ),
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
    logger.info('ストレージ保存に失敗したので保存済みのレコードを論理削除します')
    // Step 4: ストレージ保存失敗時はDBレコードを論理削除
    const { error: deleteError } = await supabase
      .from('exercises')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', exerciseId)
    if (deleteError) {
      logger.error('論理削除にも失敗しました:', deleteError)
      return {
        success: false,
        error: new DatabaseQueryError(
          saveGeneratedExercise.name,
          'UPDATE',
          'exercises',
          `ストレージ保存失敗 & 論理削除失敗: Storage: ${storageError.message}, Delete: ${deleteError.message}`,
        ),
      }
    }

    return {
      success: false,
      error: new StorageError(
        saveGeneratedExercise.name,
        STORAGE_OPERATION.UPLOAD,
        'exercises',
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
