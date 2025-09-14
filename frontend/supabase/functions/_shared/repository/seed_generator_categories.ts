import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.ts'
import type { SeedGeneratorCategoriesRow } from '../types/seed_generator_categories.ts'

type PickRandomCategoryParams = {
  client: SupabaseClient<Database>
}
type PickRandomCategoryResponse =
  | {
      success: true
      data: SeedGeneratorCategoriesRow
      error?: never
    }
  | {
      success: false
      data?: never
      error: string
    }
export async function pickRandomCategory(
  params: PickRandomCategoryParams,
): Promise<PickRandomCategoryResponse> {
  const { client } = params

  // カウント取得
  const { count, error: cntErr } = await client
    .from('seed_generator_categories')
    .select('id', { count: 'exact', head: true })

  if (cntErr) {
    return { success: false, error: cntErr.message }
  }

  if (!count || count === 0) {
    return { success: false, error: 'no categories' }
  }

  const offset = Math.floor(Math.random() * count)
  const { data, error } = await client
    .from('seed_generator_categories')
    .select('*')
    .range(offset, offset)
    .limit(1)

  if (error) {
    return { success: false, error: error.message }
  }

  if (!data?.length) {
    return { success: false, error: 'failed to fetch random category' }
  }

  return {
    success: true,
    data: data[0],
  }
}
