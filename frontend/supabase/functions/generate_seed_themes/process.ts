import { z } from 'https://esm.sh/zod@3.23.8'
import { baseRequestSchema } from '../_shared/http/request.ts'
import { RawShapeOf, RunJobParams } from '../_shared/job_runner.ts'
import { deps } from './deps.ts'
import { logger } from '../_shared/log/log.ts'
import { ExtractResultData } from '../_shared/types/common.ts'
import { OperationError, UnexpectedError } from '../_shared/error/error.ts'
import { ERROR_CATEGORIES, ERROR_CODES } from '../_shared/error/code.ts'
import {
  seedGeneratorThemeCategories,
  seedGeneratorThemes,
} from '../_shared/drizzle/schema.ts'
import { DrizzleError } from 'drizzle-orm/errors'

const { pickRandomCategory, generateTheme, getDrizzleDBClient } = deps

export const reqSchema = baseRequestSchema.extend({
  generate_theme_count: z.number().optional(),
})
export type ShapeOfReqSchema = RawShapeOf<typeof reqSchema>

export const jobProcess: RunJobParams<ShapeOfReqSchema>['jobProcess'] = async (
  supabase,
  params,
) => {
  const { generate_theme_count } = params

  const executionCount = generate_theme_count ?? 1
  logger.info(`実行回数: ${executionCount}`)
  let metrics: ExtractResultData<
    RunJobParams<ShapeOfReqSchema>['jobProcess']
  >['metrics'] = {
    storage: [],
    db: [],
    errors: [],
  }
  for (let i = 0; i < executionCount; i++) {
    // カテゴリーをランダムに取得
    const {
      success: pickRandomCategorySuccess,
      data: category,
      error: pickRandomCategoryError,
    } = await pickRandomCategory({ client: supabase })
    if (!pickRandomCategorySuccess) {
      return { success: false, error: pickRandomCategoryError }
    }
    logger.debug(`ランダムに選択されたカテゴリー: ${category.name}`)

    // テーマを作成(テーマが既存のテーマと重複したら再作成)
    const {
      success: generateThemeSuccess,
      data: generateThemeData,
      error: generateThemeError,
    } = await generateTheme({ supabase, category, maxRetryCount: 3 })
    if (!generateThemeSuccess) {
      if (
        generateThemeError instanceof OperationError &&
        generateThemeError.code === ERROR_CODES.MAX_RETRY_ERROR
      ) {
        const error = {
          functionName: generateThemeError.functionName,
          code: generateThemeError.code,
          category: generateThemeError.category,
          message: `${generateThemeError.summary} ${generateThemeError.detail}`,
        }
        metrics = { ...metrics, errors: [...(metrics?.errors ?? []), error] }
        continue
      }
      return { success: false, error: generateThemeError }
    }
    logger.debug('生成されたテーマ: ', generateThemeData)

    // 作成されたテーマを保存
    try {
      const drizzleDB = getDrizzleDBClient()
      const { insertedTheme, insertedThemeCategories } = await drizzleDB.transaction(
        async (tx) => {
          // テーマを挿入
          const [insertedTheme] = await tx
            .insert(seedGeneratorThemes)
            .values({
              title: generateThemeData.themeTitle,
              description: generateThemeData.themeDescription,
              canonical_key: generateThemeData.canonicalKey,
              created_by: 'system',
              is_active: true,
            })
            .returning({ id: seedGeneratorThemes.id })

          // カテゴリ関連を挿入
          const [insertedThemeCategories] = await tx
            .insert(seedGeneratorThemeCategories)
            .values({
              theme_id: insertedTheme.id,
              category_id: category.id,
            })
            .returning()

          return { insertedTheme, insertedThemeCategories }
        },
      )
      metrics = {
        ...metrics,
        db: [
          ...(metrics?.db ?? []),
          { tableName: 'seed_generator_themes', insert: [insertedTheme.id] },
          {
            tableName: 'seed_generator_theme_categories',
            insert: [
              insertedThemeCategories.theme_id,
              insertedThemeCategories.category_id,
            ],
          },
        ],
      }
    } catch (e) {
      if (e instanceof DrizzleError) {
        const error = {
          functionName: jobProcess.name,
          code: ERROR_CODES.DATABASE_QUERY_ERROR,
          category: ERROR_CATEGORIES.SYSTEM_ERROR,
          message: `エラー名: ${e.name}, 原因: ${e.cause}, 詳細: ${e.message}`,
        }
        metrics = { ...metrics, errors: [...(metrics.errors ?? []), error] }
        continue
      }

      return {
        success: false,
        error: new UnexpectedError(jobProcess.name, e),
      }
    }
  }

  return {
    success: true,
    data: {
      status: (metrics?.errors?.length ?? 0 > 0) ? 'warn' : 'success',
      metrics,
    },
  }
}
