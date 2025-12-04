import { Database, Tables, Constants } from './schema'

export type UserProfile = Tables<'user_profiles'>
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export type Exercise = Database['public']['Tables']['exercises']['Row']
export type ExerciseType = Database['public']['Enums']['exercise_type']
export const EXERCISE_TYPE = Constants.public.Enums.exercise_type
export type ExerciseDifficulty = Database['public']['Enums']['difficulty_level']
export const EXERCISE_DIFFICULTY = Constants.public.Enums.difficulty_level

export type ExerciseEvaluationDetailInsert =
  Database['public']['Tables']['exercise_evaluation_details']['Insert']

export type ExerciseEvaluationRubrics =
  Database['public']['Tables']['exercise_evaluation_rubrics']['Row']

export type LlmVendor = Database['public']['Enums']['llm_vendor']
