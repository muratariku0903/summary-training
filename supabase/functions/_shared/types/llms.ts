import type { Database } from './db_schema.ts'

export type LlmsRow = Database['public']['Tables']['llms']['Row']

export type Vendor = Database['public']['Enums']['llm_vendor']
