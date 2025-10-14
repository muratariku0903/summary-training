import { z } from 'https://esm.sh/zod@3.23.8'
import { createClient } from '@supabase/supabase-js'
import { DrizzleError } from 'drizzle-orm/errors'
import type { Database } from '../_shared/types/database.ts'
import { jsonErr, jsonOk } from '../_shared/http/http.ts'
import { pickRandomCategory } from '../_shared/repository/seed_generator_categories.ts'
import { drizzleDB } from '../_shared/drizzle/client.ts'
import {
  seedGeneratorThemeCategories,
  seedGeneratorThemes,
} from '../_shared/drizzle/schema.ts'
import { RawShapeOf, runJob, RunJobParams } from '../_shared/job_runner.ts'
import { baseRequestSchema } from '../_shared/http/request.ts'
import {
  InvalidRequestError,
  OperationError,
  UnexpectedError,
} from '../_shared/error/error.ts'
import { logger } from '../_shared/log/log.ts'
import { ExtractResultData } from '../_shared/types/common.ts'
import { generateTheme } from '../_shared/usecase/generate_themes/generate_themes.ts'
import { ERROR_CATEGORIES, ERROR_CODES } from '../_shared/error/code.ts'
import { JOB_NAMES } from '../_shared/const.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const reqSchema = baseRequestSchema.extend({
  generate_theme_count: z.number().optional(),
})
type ShapeOfReqSchema = RawShapeOf<typeof reqSchema>

Deno.serve(async (req) => {
  logger.debug('req: ', req)

  if (CRON_SECRET) {
    const given = req.headers.get('x-cron-secret')
    if (given !== CRON_SECRET) return jsonErr({ ok: false, error: 'unauthorized' }, 401)
  }

  try {
    const params: RunJobParams<ShapeOfReqSchema> = {
      req,
      supabase,
      reqSchema,
      jobKey: JOB_NAMES.GENERATE_SEED_THEMES,
      jobProcess,
      enableMultiJob: false,
    }
    const { success, data, error } = await runJob(params)
    if (!success) {
      return jsonErr(error, error instanceof InvalidRequestError ? 400 : 500)
    }

    return jsonOk({ data })
  } catch (e) {
    logger.error('想定外のエラー', e)
    return jsonErr(e, 500)
  }
})

const jobProcess: RunJobParams<ShapeOfReqSchema>['jobProcess'] = async (params) => {
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
      status: metrics?.errors ? 'warn' : 'success',
      metrics,
    },
  }
}
