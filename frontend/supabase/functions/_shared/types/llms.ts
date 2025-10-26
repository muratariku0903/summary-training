import type { Database } from './database.ts'

export type LlmsRow = Database['public']['Tables']['llms']['Row']

export type Vendor = Database['public']['Enums']['llm_vendor']
