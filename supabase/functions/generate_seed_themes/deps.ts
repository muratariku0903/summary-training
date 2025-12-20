import { pickRandomCategory } from '../_shared/repository/seed_generator_categories.ts'
import { generateTheme } from '../_shared/usecase/generate_themes/generate_themes.ts'
import { getDrizzleDBClient } from '../_shared/db/drizzle/client.ts'

export const deps = {
  pickRandomCategory,
  generateTheme,
  getDrizzleDBClient,
}
