import type { SupabaseClient } from '@supabase/supabase-js'
import {
  DatabaseFunctionsError,
  DatabaseQueryError,
  OperationError,
} from '../../error/error.ts'
import { generateSeedTheme } from '../../openai/functions/generate_seed_theme.ts'
import {
  isExactSimilarTheme,
  isSimilarTheme,
} from '../../repository/seed_generator_themes.ts'
import { Result } from '../../types/common.ts'
import { Database } from '../../types/database.ts'
import { SeedGeneratorCategoriesRow } from '../../types/seed_generator_categories.ts'
import { normalizeCanonical } from '../../utils/utils.ts'
import { logger } from '../../log/log.ts'
import { ERROR_CODES } from '../../error/code.ts'

type GenerateThemeParams = {
  supabase: SupabaseClient<Database>
  category: SeedGeneratorCategoriesRow
  maxRetryCount: number
}
export type GenerateThemeResponse = {
  themeTitle: string
  themeDescription: string
  canonicalKey: string
}
export const generateTheme = async (
  params: GenerateThemeParams,
): Promise<
  Result<
    GenerateThemeResponse,
    DatabaseQueryError | DatabaseFunctionsError | OperationError
  >
> => {
  const { supabase, category, maxRetryCount } = params

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
    logger.debug('生成されたテーマタイトル: ', generatedTheme.title)
    logger.debug('生成されたテーマ説明文: ', generatedTheme.description)

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
    logger.debug('existsExactSimilarTheme: ', existsExactSimilarTheme)
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
    logger.debug('isSimilarThemeData: ', isSimilarThemeData)
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
      error: new OperationError(
        generateTheme.name,
        ERROR_CODES.MAX_RETRY_ERROR,
        'ユニークなテーマ生成に失敗しました',
        `最大リトライ回数:${MAX_RETRY_COUNT}に到達しました`,
      ),
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
