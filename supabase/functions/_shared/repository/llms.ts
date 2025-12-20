import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/db_schema.ts'
import { LlmsRow, Vendor } from '../types/llms.ts'
import { Result } from '../types/common.ts'
import { DatabaseQueryError } from '../error/error.ts'

type GetLLMByIdParams = {
  client: SupabaseClient<Database>
  llmId: string
}
type GetLLMByIdResponse = LlmsRow | null

export async function getLLMById(
  params: GetLLMByIdParams,
): Promise<Result<GetLLMByIdResponse, DatabaseQueryError>> {
  const { client, llmId } = params

  const { data, error } = await client
    .from('llms')
    .select('*')
    .eq('id', llmId)
    .eq('is_active', true)
    .single()

  if (error) {
    return {
      success: false,
      error: new DatabaseQueryError(getLLMById.name, 'SELECT', 'llms', error.message),
    }
  }

  return { success: true, data }
}
type GetLLMByVendorAndModelParams = {
  client: SupabaseClient<Database>
  vendor: Vendor
  model: string
}
type GetLLMByVendorAndModelResponse = LlmsRow | null

export async function getLLMByVendorAndModel(
  params: GetLLMByVendorAndModelParams,
): Promise<Result<GetLLMByVendorAndModelResponse, DatabaseQueryError>> {
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
    return {
      success: false,
      error: new DatabaseQueryError(
        getLLMByVendorAndModel.name,
        'SELECT',
        'llms',
        error.message,
      ),
    }
  }

  return { success: true, data }
}
