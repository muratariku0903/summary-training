import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '../../_shared/types/database.ts'
import { Result } from '../types/common.ts'

export type ExerciseGeneratorProfile = Tables<'exercise_generator_profiles'>

export async function findById(
  supabase: SupabaseClient<Database>,
  profileId: string,
): Promise<Result<ExerciseGeneratorProfile | null>> {
  const { data, error } = await supabase
    .from('exercise_generator_profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (error) {
    // レコードが見つからない場合は null を返す
    if (error.code === 'PGRST116') {
      return { success: true, data: null }
    }
    return { success: false, error }
  }

  return { success: true, data }
}
