import {
  generateSeedDataFromTheme,
  generateSeedFromThemeConfigSchema,
} from '../_shared/usecase/generate_seeds/generate_seeds.ts'
import { saveSeed } from '../_shared/repository/exercise_generator_seeds.ts'
import { getActiveProfileById } from '../_shared/repository/seed_generator_profiles.ts'

export const deps = {
  generateSeedFromThemeConfigSchema,
  getActiveProfileById,
  generateSeedDataFromTheme,
  saveSeed,
}
