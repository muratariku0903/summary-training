import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../_shared/types/database.ts'
import { Result } from '../types/common.ts'

const SIM_TITLE = 0.92
const SIM_TEXT = 0.87
const HITS_LIMIT = 3

export type DupHit = { id: string; title: string; sim: number; snippet: string }

export async function findSimilarByTitle(
  supabase: SupabaseClient<Database>,
  title: string,
): Promise<Result<DupHit[]>> {
  const { data, error } = await supabase.rpc('find_similar_seeds_by_title', {
    q: title,
    min_sim: SIM_TITLE,
    lim: HITS_LIMIT,
  })
  if (error) return { success: false, error }

  return { success: true, data: data ?? [] }
}

export async function findSimilarByRawText(
  supabase: SupabaseClient<Database>,
  rawText: string,
): Promise<Result<DupHit[]>> {
  const { data, error } = await supabase.rpc('find_similar_seeds_by_raw_text', {
    q: rawText,
    min_sim: SIM_TEXT,
    lim: HITS_LIMIT,
  })
  if (error) return { success: false, error }

  return { success: true, data: data ?? [] }
}
