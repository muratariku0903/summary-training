import type { Database } from './database.ts'

export type ExerciseGeneratorSourcesRow =
  Database['public']['Tables']['exercise_generator_sources']['Row']

type AggregateTypeEnum = ExerciseGeneratorSourcesRow['aggregate_type']
export const AGGREGATE_TYPES: Record<Uppercase<AggregateTypeEnum>, AggregateTypeEnum> = {
  THEME: 'theme',
  CUSTOM: 'custom',
} as const
