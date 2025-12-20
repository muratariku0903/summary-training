import type { Database } from './db_schema.ts'

export type ExercisesRow = Database['public']['Tables']['exercises']['Row']

export type ExercisesInsertRow = Database['public']['Tables']['exercises']['Insert']
