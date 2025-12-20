import { deletePattern } from '../_shared/repository/exercise_generator_source_patterns.ts'
import {
  generateExerciseByLlmFromSourcesParams,
  resolveOutputConfigByProfileId,
  resolveSourcesByProfileId,
  saveGeneratedExercise,
} from '../_shared/usecase/generate_exercises/generate_exercises.ts'

export const deps = {
  resolveOutputConfigByProfileId,
  resolveSourcesByProfileId,
  generateExerciseByLlmFromSourcesParams,
  saveGeneratedExercise,
  deletePattern,
}
