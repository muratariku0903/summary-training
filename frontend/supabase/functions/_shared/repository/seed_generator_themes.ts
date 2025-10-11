import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.ts'
import { SeedGeneratorThemesRow } from '../types/seed_generator_themes.ts'
import { logger } from '../log/log.ts'
import { Result } from '../types/common.ts'
import { DatabaseFunctionsError, DatabaseQueryError } from '../error/error.ts'

type IsExactSimilarThemeParams = {
  client: SupabaseClient<Database>
  themeCanonicalKey: string
}
type IsExactSimilarThemeResponse = boolean
export async function isExactSimilarTheme(
  params: IsExactSimilarThemeParams,
): Promise<Result<IsExactSimilarThemeResponse, DatabaseQueryError>> {
  const { client, themeCanonicalKey } = params

  logger.debug('canonicalKey: ', themeCanonicalKey)

  const { data, error } = await client
    .from('seed_generator_themes')
    .select('id')
    .eq('canonical_key', themeCanonicalKey)
    .limit(1)

  if (error) {
    return {
      success: false,
      error: new DatabaseQueryError(
        isExactSimilarTheme.name,
        'SELECT',
        'seed_generator_themes',
        error.message,
      ),
    }
  }

  return { success: true, data: (data?.length ?? 0) > 0 }
}

type IsSimilarThemeParams = {
  client: SupabaseClient<Database>
  theme: string
  minSim?: number
}
type IsSimilarThemeResponse =
  | {
      hit: true
      theme: Database['public']['Functions']['find_similar_themes']['Returns'][number]
    }
  | {
      hit: false
      theme?: never
    }
export async function isSimilarTheme(
  params: IsSimilarThemeParams,
): Promise<Result<IsSimilarThemeResponse, DatabaseFunctionsError>> {
  const { client, theme, minSim } = params

  const { data, error } = await client.rpc('find_similar_themes', {
    q: theme ?? '',
    min_sim: minSim,
    lim: 1,
  })
  if (error) {
    return {
      success: false,
      error: new DatabaseFunctionsError(
        isExactSimilarTheme.name,
        'find_similar_themes',
        error.message,
      ),
    }
  }
  logger.debug('find_similar_themes: ', data)

  if (!data || (data && data.length === 0)) {
    return {
      success: true,
      data: { hit: false },
    }
  }

  return {
    success: true,
    data: { hit: true, theme: data[0] },
  }
}

// ...existing code...

type GetRandomThemeParams = {
  client: SupabaseClient<Database>
}
type GetRandomThemeResponse =
  | {
      success: true
      data: SeedGeneratorThemesRow
      error?: never
    }
  | {
      success: false
      data?: never
      error: string
    }
export async function getRandomTheme(
  params: GetRandomThemeParams,
): Promise<GetRandomThemeResponse> {
  const { client } = params

  // アクティブなテーマの総数を取得
  const { count, error: countError } = await client
    .from('seed_generator_themes')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  if (countError) {
    return { success: false, error: countError.message }
  }

  if (!count || count === 0) {
    return { success: false, error: 'not found theme' }
  }

  // ランダムなオフセットを生成
  const randomOffset = Math.floor(Math.random() * count)

  // ランダムなテーマを取得
  const { data, error } = await client
    .from('seed_generator_themes')
    .select('*')
    .eq('is_active', true)
    .range(randomOffset, randomOffset)
    .limit(1)

  if (error) {
    return { success: false, error: error.message }
  }

  if (!data) {
    return { success: false, error: 'unexpected error data is null' }
  }

  return { success: true, data: data[0] }
}
