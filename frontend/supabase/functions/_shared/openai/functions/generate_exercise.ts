import { openai } from '../openai_client.ts'
import {
  LlmExerciseGenerator,
  LlmExerciseGeneratorParams,
  LlmExerciseGeneratorResponse,
  llmExerciseGeneratorResponseSchema,
  Result,
} from '../../types/common.ts'

import { z } from 'https://esm.sh/zod@3.23.8'

export const generateExerciseSchema = z
  .object({
    system: z.array(z.string()).optional(),
    user: z.array(z.string()).optional(),
    max_chars: z.number().optional(),
    min_chars: z.number().optional(),
    temperature: z.number().optional(),
    max_tokens: z.number().optional(),
  })
  .strict()
export const generateExercise: LlmExerciseGenerator = async (
  params: LlmExerciseGeneratorParams,
): Promise<Result<LlmExerciseGeneratorResponse>> => {
  const { schema, model, sources } = params

  const {
    success: parseSuccess,
    data: parseData,
    error: parseError,
  } = generateExerciseSchema.safeParse(schema)
  if (!parseSuccess) {
    return { success: false, error: Error(parseError.message) }
  }

  const {
    system: additionalSystem,
    user: additionalUser,
    max_chars,
    min_chars,
    temperature,
    max_tokens,
  } = parseData

  const system = [
    'あなたは日本語の教材作成者です',
    '必ず JSON オブジェクトのみを返してください',
    `出力スキーマは: {
      "title": "string",
      "description": "string(<=150)",
      "body": "string",
      }`,
    'bodyは必ず sources に関連するものにしてください',
    'bodyにはでいるだけ、 sources に関連し、かつ具体性のある話題にしてください',
    `bodyは最小${min_chars ?? 500}文字、最大${max_chars ?? 2000}文字`,
    'titleとdescriptionは生成したbodyに関連するものにしてください',
    'titleは最大30文字',
    'descriptionは最大150文字',
    "禁止事項: 抽象的・汎用的なタイトル（例: '文書要約' '技術解説' 'リライト課題' など）。",
  ]
  if (additionalSystem) system.concat(additionalSystem)

  const user = [`sources: ${sources}`]
  if (additionalUser) user.concat(additionalUser)

  try {
    const res = await openai.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      temperature: temperature ?? 0.5,
      // 「生成する文字列の数」を制限するパラメータ
      max_tokens: max_tokens ?? calculateMaxTokens(max_chars ?? 2000),
      messages: [
        // AIに全体的な指示や役割、振る舞いを伝えるため
        { role: 'system', content: system.join('\n') },
        // ユーザーからの質問や命令を表現
        { role: 'user', content: user.join('\n') },
      ],
    })

    const content = res.choices?.[0]?.message?.content
    if (!content) return { success: false, error: Error('OpenAI returned no content') }

    let json: unknown
    try {
      json = JSON.parse(content)
      console.log(json)
    } catch {
      return { success: false, error: Error('Invalid JSON from OpenAI generated') }
    }

    const { data, error, success } = llmExerciseGeneratorResponseSchema.safeParse(json)
    if (!success) {
      const msg = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')

      return { success: false, error: Error(`schema validation failed: ${msg}`) }
    }

    const g: LlmExerciseGeneratorResponse = {
      title: data.title,
      description: data.description,
      body: data.body,
    }

    return { success: true, data: g }
  } catch (e) {
    console.error('fail generate openai.chat.completions.create', e)
    return { success: false, error: e instanceof Error ? e : Error(String(e)) }
  }
}

// 生成文字数に応じた適切なトークン数を計算
const calculateMaxTokens = (maxChars: number): number => {
  // 日本語: 1文字 ≈ 2-3トークン + バッファ
  const estimatedTokens = Math.ceil(maxChars * 3.5)
  return Math.max(1000, estimatedTokens)
}
