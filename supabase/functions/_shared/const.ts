export const JOB_NAMES = {
  GENERATE_SEED_THEMES: 'generate_seed_themes',
  GENERATE_EXERCISE_SEEDS: 'generate_exercise_seeds',
  AGGREGATE_EXERCISE_SOURCES: 'aggregate_exercise_sources',
  GENERATE_EXERCISES: 'generate_exercises',
} as const
// 追加: 型定義
export type JobKey = keyof typeof JOB_NAMES
export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES]
