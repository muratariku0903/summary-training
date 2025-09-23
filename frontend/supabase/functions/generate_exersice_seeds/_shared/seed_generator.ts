import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../_shared/types/database.ts'
import { z } from 'https://esm.sh/zod@3.23.8'
import { generateSeed } from '../../_shared/openai/functions/generate_seed.ts'
import {
  ExerciseGeneratorSeedsInsertRow,
  ExerciseGeneratorSeedsRow,
} from '../../_shared/types/exercise_generator_seeds.ts'
import { getRandomTheme } from '../../_shared/repository/seed_generator_themes.ts'
import { getLLMByVendorAndModel } from '../../_shared/repository/llms.ts'
import {
  DupHit,
  findSimilarByRawText,
  findSimilarByTitle,
} from '../../_shared/repository/exercise_generator_seeds.ts'
import { Result } from '../../_shared/types/common.ts'

type GenerateSeedResult = {
  locale: string
  title: string
  summary: string
  rawText: string
}

type GenerateExerciseSeedParams = {
  client: SupabaseClient<Database>
  profileId: string
  themeId: string | null
  llmId: string | null
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
export const saveSeed = async (
  params: GenerateExerciseSeedParams,
): Promise<GenerateExerciseSeedResponse> => {
  const { client, profileId, themeId, llmId, seedData } = params

  const row: ExerciseGeneratorSeedsInsertRow = {
    status: 'active',
    generator_profile_id: profileId,
    theme_id: themeId,
    llm_id: llmId,
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
  theme_id: z.string().uuid().optional(),
  llm_id: z.string().uuid().optional(),
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
      data: {
        themeId: string
        llmId: string
        result: GenerateSeedResult
      }
      error?: never
    }
  | {
      success: false
      data?: never
      error: string
    }

export const generateSeedDataFromTheme = async (
  params: GenerateSeedFromThemeParams,
): Promise<GenerateSeedFromThemeResponse> => {
  const { client, config } = params
  const { theme_id, llm_id } = config

  // テーマの取得とLLMの取得を並行実行
  const [themeResult, llmResult] = await Promise.all([
    // テーマの取得
    theme_id
      ? client
          .from('seed_generator_themes')
          .select('*')
          .eq('id', theme_id)
          .eq('is_active', true)
          .single()
          .then(({ data, error }) => ({ data, error: error?.message }))
      : getRandomTheme({ client }).then(({ success, data, error }) => ({
          data: success ? data : null,
          error: success ? null : error,
        })),

    // LLMの取得
    llm_id
      ? client
          .from('llms')
          .select('*')
          .eq('id', llm_id)
          .eq('is_active', true)
          .single()
          .then(({ data, error }) => ({ data, error: error?.message }))
      : getLLMByVendorAndModel({
          client,
          vendor: 'openai',
          model: 'gpt-3.5-turbo',
        }).then(({ success, data, error }) => ({
          data: success ? data : null,
          error: success ? null : error,
        })),
  ])

  // テーマの結果チェック
  if (themeResult.error) {
    return {
      success: false,
      error: `${themeResult.error}: ${themeResult.error}`,
    }
  }
  if (!themeResult.data) {
    return {
      success: false,
      error: 'not found theme from seed_generator_themes',
    }
  }
  const targetTheme = themeResult.data
  console.log('targetTheme: ', targetTheme)

  // LLMの結果チェック
  if (llmResult.error) {
    return {
      success: false,
      error: `${llmResult.error}`,
    }
  }
  if (!llmResult.data) {
    return {
      success: false,
      error: llmResult.error ?? 'llm data must not be null',
    }
  }
  const targetLlm = llmResult.data
  console.log('targetLlm: ', targetLlm)

  const { title, description } = targetTheme
  const { vendor, model } = targetLlm

  switch (vendor) {
    case 'openai': {
      const { success, data, error } = await generateSeed({
        title: title ?? '',
        description: description ?? '',
        model,
        duplicateChecker: async (data) => {
          const { success: checkDuplicateSuccess, data: checkDuplicateData } =
            await checkDuplicateSeed(client, {
              title: data.title,
              rawText: data.body,
            })
          if (!checkDuplicateSuccess) {
            return { duplicate: false, duplicateReason: null }
          }

          return {
            duplicate: checkDuplicateData.decision === 'duplicate',
            duplicateReason: checkDuplicateData.reasons
              .map((e) => `重複項目：${e.by} 理由：${e.hits.join(',')} `)
              .join(','),
          }
        },
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
          themeId: targetTheme.id,
          llmId: targetLlm.id,
          result: {
            locale: 'ja_JP',
            title: data.title,
            summary: data.description,
            rawText: data.body,
          },
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

const checkDuplicateSeed = async (
  supabase: SupabaseClient<Database>,
  candidate: {
    title: ExerciseGeneratorSeedsRow['title']
    rawText: ExerciseGeneratorSeedsRow['raw_text']
  },
): Promise<
  Result<{
    decision: 'duplicate' | 'unique'
    reasons: { by: 'title' | 'text'; hits: DupHit[] }[]
  }>
> => {
  const [byTitle, byText] = await Promise.all([
    findSimilarByTitle(supabase, candidate.title ?? ''),
    findSimilarByRawText(supabase, candidate.rawText ?? ''),
  ])

  const reasons: { by: 'title' | 'text'; hits: DupHit[] }[] = []
  if (byTitle.success && byTitle.data.length >= 1) {
    reasons.push({ by: 'title', hits: byTitle.data })
  }
  if (byText.success && byText.data.length >= 1) {
    reasons.push({ by: 'text', hits: byText.data })
  }

  const decision = reasons.length >= 1 ? 'duplicate' : 'unique'

  return { success: true, data: { decision, reasons } }
}
