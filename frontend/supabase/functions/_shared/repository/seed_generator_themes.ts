import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.ts'

type IsExactSimilarThemeParams = {
  client: SupabaseClient<Database>
  themeCanonicalKey: string
}
type IsExactSimilarThemeResponse =
  | {
      success: true
      data: boolean
      error?: never
    }
  | {
      success: false
      data?: never
      error: string
    }
export async function isExactSimilarTheme(
  params: IsExactSimilarThemeParams,
): Promise<IsExactSimilarThemeResponse> {
  const { client, themeCanonicalKey } = params

  console.log('canonicalKey: ', themeCanonicalKey)

  const { data, error } = await client
    .from('seed_generator_themes')
    .select('id')
    .eq('canonical_key', themeCanonicalKey)
    .limit(1)

  if (error) {
    return { success: false, error: error.message }
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
      success: true
      data:
        | {
            hit: true
            theme: Database['public']['Functions']['find_similar_themes']['Returns'][number]
          }
        | {
            hit: false
            theme?: never
          }
      error?: never
    }
  | {
      success: false
      data?: never
      error: string
    }
export async function isSimilarTheme(
  params: IsSimilarThemeParams,
): Promise<IsSimilarThemeResponse> {
  const { client, theme, minSim } = params

  const { data, error } = await client.rpc('find_similar_themes', {
    q: theme ?? '',
    min_sim: minSim,
    lim: 1,
  })
  if (error) {
    return { success: false, error: error.message }
  }

  console.log('find_similar_themes: ', data)

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
