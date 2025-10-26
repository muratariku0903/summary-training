import type { Database } from './database.ts'

export type ExercisesRow = Database['public']['Tables']['exercises']['Row']

export type ExercisesInsertRow = Database['public']['Tables']['exercises']['Insert']
