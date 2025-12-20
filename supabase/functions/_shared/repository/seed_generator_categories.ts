import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/db_schema.ts'
import type { SeedGeneratorCategoriesRow } from '../types/seed_generator_categories.ts'
import { Result } from '../types/common.ts'
import { DatabaseQueryError, EmptyTableError } from '../error/error.ts'

type PickRandomCategoryParams = {
  client: SupabaseClient<Database>
}

export async function pickRandomCategory(
  params: PickRandomCategoryParams,
): Promise<Result<SeedGeneratorCategoriesRow, DatabaseQueryError | EmptyTableError>> {
  const { client } = params

  // カウント取得
  const { count, error: cntErr } = await client
    .from('seed_generator_categories')
    .select('id', { count: 'exact', head: true })
  if (cntErr) {
    return {
      success: false,
      error: new DatabaseQueryError(
        pickRandomCategory.name,
        'COUNT',
        'seed_generator_categories',
      ),
    }
  }

  if (!count || count === 0) {
    return {
      success: false,
      error: new EmptyTableError(
        pickRandomCategory.name,
        'seed_generator_theme_categories',
      ),
    }
  }

  const offset = Math.floor(Math.random() * count)
  const { data, error } = await client
    .from('seed_generator_categories')
    .select('*')
    .range(offset, offset)
    .limit(1)
  if (error) {
    return {
      success: false,
      error: new DatabaseQueryError(
        pickRandomCategory.name,
        'SELECT',
        'seed_generator_categories',
      ),
    }
  }
  if (!data?.length) {
    return {
      success: false,
      error: new EmptyTableError(
        pickRandomCategory.name,
        'seed_generator_theme_categories',
      ),
    }
  }

  return {
    success: true,
    data: data[0],
  }
}
