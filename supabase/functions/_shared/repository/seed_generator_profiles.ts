import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.ts'
import type { SeedGeneratorProfilesRow } from '../types/seed_generator_profiles.ts'
import { Result } from '../types/common.ts'
import { DatabaseQueryError, OperationError } from '../error/error.ts'
import { ERROR_CODES } from '../error/code.ts'

type GetActiveProfileByIdParams = {
  client: SupabaseClient<Database>
  profileId: string
}

/**
 * 指定IDのプロファイルを取得し、アクティブであることを検証して返す
 */
export async function getActiveProfileById(
  params: GetActiveProfileByIdParams,
): Promise<Result<SeedGeneratorProfilesRow, DatabaseQueryError | OperationError>> {
  const { client, profileId } = params

  const { data: profile, error } = await client
    .from('seed_generator_profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (error || !profile) {
    return {
      success: false,
      error: new DatabaseQueryError(
        getActiveProfileById.name,
        'SELECT',
        'seed_generator_profiles',
      ),
    }
  }

  if (!profile.is_active) {
    return {
      success: false,
      error: new OperationError(
        getActiveProfileById.name,
        ERROR_CODES.RECORD_NOT_ACTIVE,
        '指定されたプロファイルが無効です',
        `profile_id: ${profileId} table: seed_generator_profiles`,
      ),
    }
  }

  return { success: true, data: profile }
}
