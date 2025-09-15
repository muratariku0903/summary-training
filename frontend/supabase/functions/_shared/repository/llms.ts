import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.ts'
import { LlmsRow, Vendor } from '../types/llms.ts'

type GetLLMByVendorAndModelParams = {
  client: SupabaseClient<Database>
  vendor: Vendor
  model: string
}
type GetLLMByVendorAndModelResponse =
  | {
      success: true
      data: LlmsRow | null
      error?: never
    }
  | {
      success: false
      data?: never
      error: string
    }

export async function getLLMByVendorAndModel(
  params: GetLLMByVendorAndModelParams,
): Promise<GetLLMByVendorAndModelResponse> {
  const { client, vendor, model } = params

  const { data, error } = await client
    .from('llms')
    .select('*')
    .eq('vendor', vendor)
    .eq('model', model)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}
