import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../_shared/types/database.ts'
import { z } from 'https://esm.sh/zod@3.23.8'
import { generateSeed } from '../../_shared/openai/functions/generate_seed.ts'
import { ExerciseGeneratorSeedsInsertRow } from '../../_shared/types/exercise_generator_seeds.ts'

type GenerateSeedResult = {
  locale: string
  title: string
  summary: string
  rawText: string
}

type GenerateExerciseSeedParams = {
  client: SupabaseClient<Database>
  profileId: string
  seedData: GenerateSeedResult
}
type GenerateExerciseSeedResponse =
  | {
      success: true
      data: { seed_id: string }
      error?: never
    }
  | {
      success: false
      data?: never
      error: string
    }
export const generateExerciseSeed = async (
  params: GenerateExerciseSeedParams,
): Promise<GenerateExerciseSeedResponse> => {
  const { client, profileId, seedData } = params

  const row: ExerciseGeneratorSeedsInsertRow = {
    status: 'active',
    generator_profile_id: profileId,
    title: seedData.title,
    summary: seedData.summary,
    raw_text: seedData.rawText,
  }

  const { data, error } = await client
    .from('exercise_generator_seeds')
    .insert(row)
    .select('id')
    .single()
  if (error) {
    return {
      success: false,
      error: `${error.code} : ${error.message}`,
    }
  }

  return {
    success: true,
    data: { seed_id: data.id },
  }
}

export const generateSeedFromThemeConfigSchema = z.object({
  theme_id: z.string().uuid(),
  llm_id: z.string().uuid(),
  prompt: z
    .object({
      user: z.string().optional(),
      system: z.string().optional(),
      min_chars: z.number().optional(),
      max_chars: z.number().optional(),
    })
    .optional(),
})
type GenerateSeedFromThemeConfig = z.infer<typeof generateSeedFromThemeConfigSchema>

type GenerateSeedFromThemeParams = {
  client: SupabaseClient<Database>
  config: GenerateSeedFromThemeConfig
}

type GenerateSeedFromThemeResponse =
  | {
      success: true
      data: GenerateSeedResult
      error?: never
    }
  | {
      success: false
      data?: never
      error: string
    }

export const generateSeedFromTheme = async (
  params: GenerateSeedFromThemeParams,
): Promise<GenerateSeedFromThemeResponse> => {
  const { client, config } = params
  const { theme_id, llm_id } = config

  const { data: theme, error: fetchThemeError } = await client
    .from('seed_generator_themes')
    .select('*')
    .eq('id', theme_id)
    .eq('is_active', true)
    .single()
  if (fetchThemeError) {
    return {
      success: false,
      error: `${fetchThemeError.name}: ${fetchThemeError.message}`,
    }
  }
  if (!theme) {
    return {
      success: false,
      error: 'not found theme from seed_generator_themes',
    }
  }

  const { data: llm, error: fetchLlmError } = await client
    .from('llms')
    .select('*')
    .eq('id', llm_id)
    .eq('is_active', true)
    .single()
  if (fetchLlmError) {
    return {
      success: false,
      error: `${fetchLlmError.name}: ${fetchLlmError.message}`,
    }
  }
  if (!llm) {
    return {
      success: false,
      error: 'not found theme from seed_generator_themes',
    }
  }

  const { title, description } = theme
  const { vendor, model } = llm

  switch (vendor) {
    case 'openai': {
      const { success, data, error } = await generateSeed({
        title: title ?? '',
        description: description ?? '',
        model,
      })
      if (!success) {
        return {
          success: false,
          error,
        }
      }

      return {
        success: true,
        data: {
          locale: 'ja_JP',
          title: data.title,
          summary: data.description,
          rawText: data.body,
        },
      }
    }

    default:
      return {
        success: false,
        error: `unsupported vendor: ${vendor}`,
      }
  }
}
