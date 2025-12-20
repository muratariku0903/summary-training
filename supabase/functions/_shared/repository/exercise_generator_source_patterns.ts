import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/db_schema.ts'
import { Result } from '../types/common.ts'
import { logger } from '../log/log.ts'

/**
 * 指定されたパターンIDを論理削除する
 */
export type DeletePatternResponse = {
  id: string
  deleted_at: string
}
export async function deletePattern(
  supabase: SupabaseClient<Database>,
  patternId: string,
): Promise<Result<DeletePatternResponse>> {
  logger.start(deletePattern.name)

  try {
    const { data, error } = await supabase
      .from('exercise_generator_profile_source_patterns')
      .update({ delete_flg: true })
      .eq('id', patternId)
      .eq('delete_flg', false) // 既に削除されていないもののみ対象
      .select('id')
      .single()

    if (error) {
      return {
        success: false,
        error: Error(`パターンの削除に失敗しました: ${error.message}`),
      }
    }

    if (!data) {
      return {
        success: false,
        error: Error(`指定されたパターンが見つからないか、既に削除されています`),
      }
    }

    return {
      success: true,
      data: {
        id: data.id,
        deleted_at: new Date().toISOString(),
      },
    }
  } catch (error) {
    logger.error(deletePattern.name, error)
    return {
      success: false,
      error: Error('パターン削除処理中に予期しないエラーが発生しました'),
    }
  }
}
