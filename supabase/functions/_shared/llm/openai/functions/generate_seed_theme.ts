import { ERROR_CODES } from '../../../error/code.ts'
import { LlmError } from '../../../error/error.ts'
import { logger } from '../../../log/log.ts'
import { Result } from '../../../types/common.ts'
import { openai } from '../openai_client.ts'
import { z } from 'zod'

export const generateSeedThemeData = z
  .object({
    title: z.string().min(1).max(30),
    description: z.string().max(150),
  })
  .strict()
export type GenerateSeedData = z.infer<typeof generateSeedThemeData>

type GenerateSeedThemeParams = {
  category: string
  model: string
  additionalPrompt?: {
    user?: string
    system?: string
    minChars?: number
    maxChars?: number
    temperature?: number
  }
}
type GenerateSeedThemeResponse = GenerateSeedData
export const generateSeedTheme = async (
  params: GenerateSeedThemeParams,
): Promise<Result<GenerateSeedThemeResponse, LlmError>> => {
  const { category, model, additionalPrompt } = params

  const system = [
    'あなたは日本語の教材向け“テーマ”を考えるアシスタントです。',
    '必ず JSON オブジェクトのみを返してください',
    `出力スキーマは: {
        "title": "string",
        "description": "string",
        }`,
    'テーマは必ず category に関連するものにしてください',
    'titleは最大30文字',
    'descriptionは最大150文字',
    "禁止事項1: 抽象的・汎用的なタイトル（例: '文書要約' '技術解説' 'リライト課題' など）。",
    '禁止事項2: 固有名詞や汎用語だけは不可',
    '禁止事項3: 類義反復を避け、多様性を重視',
  ]
  if (additionalPrompt?.system) {
    system.push(additionalPrompt.system)
  }

  const user = [`category: ${category}`]
  if (additionalPrompt?.user) {
    user.push(additionalPrompt.user)
  }

  const res = await openai.chat.completions.create({
    model: model,
    response_format: { type: 'json_object' },
    temperature: additionalPrompt?.temperature ?? 0.7,
    max_tokens: 1000,
    messages: [
      // AIに全体的な指示や役割、振る舞いを伝えるため
      { role: 'system', content: system.join('\n') },
      // ユーザーからの質問や命令を表現
      { role: 'user', content: user.join('\n') },
    ],
  })

  logger.debug('openai.chat.completions.create: ', res)

  const content = res.choices?.[0]?.message?.content
  if (!content) {
    return {
      success: false,
      error: new LlmError(
        ERROR_CODES.LLM_GENERATE_CONTENT_EMPTY,
        generateSeedTheme.name,
        'openai',
        model,
        `system:${system.join('\n')}, user:${user.join('\n')}`,
      ),
    }
  }

  let json: unknown
  try {
    json = JSON.parse(content)
  } catch {
    return {
      success: false,
      error: new LlmError(
        ERROR_CODES.LLM_GENERATE_CONTENT_INVALID_FORMAT,
        generateSeedTheme.name,
        'openai',
        model,
        `system:${system.join('\n')}, user:${user.join('\n')}`,
      ),
    }
  }

  const { data, error, success } = generateSeedThemeData.safeParse(json)
  if (!success) {
    const msg = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')

    return {
      success: false,
      error: new LlmError(
        ERROR_CODES.LLM_GENERATE_CONTENT_INVALID_SCHEMA,
        generateSeedTheme.name,
        'openai',
        model,
        `system:${system.join('\n')}, user:${user.join('\n')}`,
        `schema validation failed: ${msg}`,
      ),
    }
  }

  const g: GenerateSeedData = {
    title: data.title,
    description: data.description,
  }

  return { success: true, data: g }
}
