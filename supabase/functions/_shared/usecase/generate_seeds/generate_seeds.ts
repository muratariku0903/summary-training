import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { Database } from '../../types/db_schema.ts'
import { ExerciseGeneratorSeedsRow } from '../../types/exercise_generator_seeds.ts'
import { Result } from '../../types/common.ts'
import { getTheme } from '../../repository/seed_generator_themes.ts'
import { getLLMById, getLLMByVendorAndModel } from '../../repository/llms.ts'
import { logger } from '../../log/log.ts'
import { generateSeed } from '../../openai/functions/generate_seed.ts'
import {
  DupHit,
  findSimilarByRawText,
  findSimilarByTitle,
} from '../../repository/exercise_generator_seeds.ts'
import { BaseError, OperationError, UnexpectedError } from '../../error/error.ts'
import { ERROR_CODES } from '../../error/code.ts'

type GenerateSeedResult = {
  locale: string
  title: string
  summary: string
  rawText: string
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

type GenerateSeedFromThemeResponse = {
  themeId: string
  llmId: string
  result: GenerateSeedResult
}

export const generateSeedDataFromTheme = async (
  params: GenerateSeedFromThemeParams,
): Promise<Result<GenerateSeedFromThemeResponse, BaseError>> => {
  const { client, config } = params
  const { theme_id, llm_id } = config

  // テーマの取得とLLMの取得を並行実行
  const [themeResult, llmResult] = await Promise.all([
    // テーマの取得
    getTheme({ client, themeId: theme_id }),

    // LLMの取得
    llm_id
      ? getLLMById({ client, llmId: llm_id })
      : getLLMByVendorAndModel({
          client,
          vendor: 'openai',
          model: 'gpt-3.5-turbo',
        }),
  ])

  // テーマの結果チェック
  if (themeResult.error) {
    return {
      success: false,
      error: themeResult.error,
    }
  }
  const targetTheme = themeResult.data
  logger.debug('targetTheme: ', targetTheme)

  // LLMの結果チェック
  if (llmResult.error) {
    return {
      success: false,
      error: llmResult.error,
    }
  }
  if (!llmResult.data) {
    return {
      success: false,
      error: new OperationError(
        generateSeedDataFromTheme.name,
        ERROR_CODES.RECORD_NOT_FOUND,
        'LLM情報の取得に失敗しました',
        `llm_id: ${llm_id} LLM情報はSEED生成に必須です`,
      ),
    }
  }
  const targetLlm = llmResult.data
  logger.debug('targetLlm: ', targetLlm)

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
        error: new UnexpectedError(
          generateSeedDataFromTheme.name,
          `想定外のLLMベンダが指定されました LLMベンダ: ${vendor}`,
        ),
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
