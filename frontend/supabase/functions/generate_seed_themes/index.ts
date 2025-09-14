import { z } from 'https://esm.sh/zod@3.23.8'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../_shared/types/database.ts'
import { jsonErr, jsonOk } from '../_shared/http/http.ts'
import { pickRandomCategory } from '../_shared/repository/seed_generator_categories.ts'
import { generateSeedTheme } from '../_shared/openai/functions/generate_seed_theme.ts'
import {
  isExactSimilarTheme,
  isSimilarTheme,
} from '../_shared/repository/seed_generator_themes.ts'
import { normalizeCanonical } from '../_shared/utils/utils.ts'
import { SeedGeneratorCategoriesRow } from '../_shared/types/seed_generator_categories.ts'
import { drizzleDB } from '../_shared/drizzle/client.ts'
import {
  seedGeneratorThemeCategories,
  seedGeneratorThemes,
} from '../_shared/drizzle/schema.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const reqSchema = z.object({
  generate_theme_count: z.number().optional(),
})

type Result = {
  execution: number
  success: boolean
  theme: string | null
  error: string | null
}

Deno.serve(async (req) => {
  try {
    if (CRON_SECRET) {
      const given = req.headers.get('x-cron-secret')
      if (given !== CRON_SECRET)
        return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
          status: 401,
        })
    }

    console.log('req: ', req)
    const body = await req
      .json()
      .catch(() => console.error('fail to json from request', req))
    const {
      success: parseSuccess,
      data: parseData,
      error: parseError,
    } = reqSchema.safeParse(body)
    if (!parseSuccess) {
      return jsonErr({ ok: false, error: String(parseError) }, 400)
    }
    const { generate_theme_count } = parseData

    const executionCount = generate_theme_count ?? 1
    console.log('executionCount:', executionCount)
    const results: Result[] = []
    for (let i = 0; i < executionCount; i++) {
      // カテゴリーをランダムに取得
      const {
        success: pickRandomCategorySuccess,
        data: category,
        error: pickRandomCategoryError,
      } = await pickRandomCategory({ client: supabase })
      if (!pickRandomCategorySuccess) {
        results.push({
          execution: i + 1,
          success: false,
          error: pickRandomCategoryError,
          theme: null,
        })
        continue
      }
      console.log('pick category: ', category.name)

      // テーマを作成(テーマが既存のテーマと重複したら再作成)
      const {
        success: generateThemeSuccess,
        data: generateThemeData,
        error: generateThemeError,
      } = await generateTheme({ category, maxRetryCount: 3 })
      if (!generateThemeSuccess) {
        results.push({
          execution: i + 1,
          success: false,
          theme: null,
          error: generateThemeError,
        })
        continue
      }
      console.log('generateThemeData: ', generateThemeData)

      // 作成されたテーマを保存
      try {
        const result = await drizzleDB.transaction(async (tx) => {
          // テーマを挿入
          const [insertedTheme] = await tx
            .insert(seedGeneratorThemes)
            .values({
              title: generateThemeData.themeTitle,
              description: generateThemeData.themeDescription,
              canonical_key: generateThemeData.canonicalKey,
              status: 'active',
            })
            .returning({ id: seedGeneratorThemes.id })

          // カテゴリ関連を挿入
          await tx.insert(seedGeneratorThemeCategories).values({
            theme_id: insertedTheme.id,
            category_id: category.id,
          })

          return insertedTheme
        })
        results.push({
          execution: i + 1,
          success: true,
          theme: result.id,
          error: null,
        })
      } catch (error) {
        results.push({
          execution: i + 1,
          success: false,
          theme: null,
          error: String(error),
        })
        continue
      }
    }

    const successCount = results.filter((r) => r.success).length

    return jsonOk({
      ok: true,
      total_executions: executionCount,
      successful_executions: successCount,
      failed_executions: executionCount - successCount,
      results,
    })
  } catch (e) {
    console.error('unexpected error', e)
    return jsonErr({ ok: false, error: String(e) }, 500)
  }
})

type GenerateThemeParams = {
  category: SeedGeneratorCategoriesRow
  maxRetryCount: number
}
type GenerateThemeResponse =
  | {
      success: true
      data: {
        themeTitle: string
        themeDescription: string
        canonicalKey: string
      }
      error?: never
    }
  | {
      success: false
      data?: never
      error: string
    }
const generateTheme = async (
  params: GenerateThemeParams,
): Promise<GenerateThemeResponse> => {
  const { category, maxRetryCount } = params

  const MAX_RETRY_COUNT = maxRetryCount

  let retryCount = 0
  let theme: {
    title: string
    description: string
  } | null = null
  let themeCanonicalKey: string | null = null

  while (retryCount < MAX_RETRY_COUNT) {
    // テーマを作成
    const {
      success: generateSeedThemeSuccess,
      data: generatedTheme,
      error: generateSeedThemeError,
    } = await generateSeedTheme({
      category: category.name,
      model: 'gpt-3.5-turbo',
    })
    if (!generateSeedThemeSuccess) {
      return { success: false, error: generateSeedThemeError }
    }
    console.log('generated theme title: ', generatedTheme.title)
    console.log('generated theme description: ', generatedTheme.description)

    theme = generatedTheme

    // 重複検知
    // canonical_keyを使用した厳格なチェック
    themeCanonicalKey = normalizeCanonical(theme.title)
    const {
      success: isExactSimilarThemeSuccess,
      data: existsExactSimilarTheme,
      error: isExactSimilarThemeError,
    } = await isExactSimilarTheme({
      client: supabase,
      themeCanonicalKey,
    })
    if (!isExactSimilarThemeSuccess) {
      return { success: false, error: isExactSimilarThemeError }
    }
    console.log('existsExactSimilarTheme: ', existsExactSimilarTheme)
    if (existsExactSimilarTheme) {
      retryCount++
      continue // 重複テーマのため再試行
    }

    // 近似値チェック
    const {
      success: isSimilarThemeSuccess,
      data: isSimilarThemeData,
      error: isSimilarThemeError,
    } = await isSimilarTheme({
      client: supabase,
      theme: theme.title,
    })
    if (!isSimilarThemeSuccess) {
      return { success: false, error: isSimilarThemeError }
    }
    console.log('isSimilarThemeData: ', isSimilarThemeData)
    if (isSimilarThemeData.hit) {
      retryCount++
      continue // 重複テーマのため再試行
    }

    // 重複なしのため、ループを抜ける
    break
  }

  // 最大試行回数に達した場合のエラーハンドリング
  if (retryCount >= MAX_RETRY_COUNT) {
    return {
      success: false,
      error: `Maximum retry count (${MAX_RETRY_COUNT}) reached. Could not generate unique theme.`,
    }
  }

  return {
    success: true,
    data: {
      themeDescription: theme?.description ?? '',
      themeTitle: theme?.title ?? '',
      canonicalKey: themeCanonicalKey ?? '',
    },
  }
}
