import { openai } from '../openai_client.ts'
import { z } from 'https://esm.sh/zod@3.23.8'

export const generateSeedData = z
  .object({
    title: z.string().min(1).max(30),
    difficulty: z.coerce.number().int().min(1).max(5),
    description: z.string().max(150),
    body: z.string(),
  })
  .strict()
export type GenerateSeedData = z.infer<typeof generateSeedData>

type GenerateSeedParams = {
  title: string
  description: string
  model: string
  additionalPrompt?: {
    user?: string
    system?: string
    minChars?: number
    maxChars?: number
    temperature?: number
  }
  duplicateChecker?: (
    data: GenerateSeedData,
  ) => Promise<{ duplicate: boolean; duplicateReason: string | null }>
  maxRetries?: number
}
type GenerateSeedResponse =
  | {
      success: true
      data: GenerateSeedData & { attempts: number }
      error?: never
    }
  | {
      success: false
      data?: never
      error: string
    }
export const generateSeed = async (
  params: GenerateSeedParams,
): Promise<GenerateSeedResponse> => {
  const {
    title,
    description,
    model,
    additionalPrompt,
    duplicateChecker,
    maxRetries = 3,
  } = params
  const topic = [title, description].join('\n')

  const system = [
    'あなたは日本語の教材作成者です',
    '必ず JSON オブジェクトのみを返してください',
    `出力スキーマは: {
        "title": "string",
        "difficulty": 1|2|3|4|5,
        "description": "string",
        "body": "string",
        }`,
    'bodyは必ず topic に関連するものにしてください',
    `bodyは最小${additionalPrompt?.minChars ?? 300}文字、最大${additionalPrompt?.maxChars ?? 1000}文字`,
    'titleとdescriptionは生成したbodyに関連するものにしてください',
    'titleは最大30文字',
    'descriptionは最大150文字',
    'difficultyは数値で、文章長さや、テーマの難しさの観点から1〜5で設定',
    "禁止事項: 抽象的・汎用的なタイトル（例: '文書要約' '技術解説' 'リライト課題' など）。",
  ]
  if (additionalPrompt?.system) {
    system.push(additionalPrompt.system)
  }

  const user = [`topic: ${topic}`]
  if (additionalPrompt?.user) {
    user.push(additionalPrompt.user)
  }

  // 重複理由を蓄積する配列
  const duplicateReasons: string[] = []

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (duplicateReasons.length > 0) {
      user.push(
        '\n【重要】以下の理由で重複が検出されています。これらを避けて異なる内容を生成してください：',
      )
      duplicateReasons.forEach((reason, index) => {
        user.push(`${index + 1}. ${reason}`)
      })
      user.push('\n上記と異なる角度・視点・内容で生成してください。')
    }

    const res = await openai.chat.completions.create({
      model: model,
      response_format: { type: 'json_object' },
      temperature: additionalPrompt?.temperature ?? 0.5,
      max_tokens: 1000,
      messages: [
        // AIに全体的な指示や役割、振る舞いを伝えるため
        { role: 'system', content: system.join('\n') },
        // ユーザーからの質問や命令を表現
        { role: 'user', content: user.join('\n') },
      ],
    })

    console.log('openai.chat.completions.create: ', res)

    const content = res.choices?.[0]?.message?.content
    if (!content) {
      return { success: false, error: 'OpenAI returned no content' }
    }

    let json: unknown
    try {
      json = JSON.parse(content)
    } catch {
      return { success: false, error: 'Invalid JSON from OpenAI' }
    }

    const { data, error, success } = generateSeedData.safeParse(json)
    if (!success) {
      if (attempt === maxRetries) {
        const msg = error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')

        return { success: false, error: `schema validation failed: ${msg}` }
      }

      continue
    }

    const g: GenerateSeedData = {
      title: data.title,
      difficulty: data.difficulty,
      description: data.description,
      body: data.body,
    }

    // 重複チェック
    if (duplicateChecker) {
      const duplicateResult = await duplicateChecker(g)
      if (duplicateResult.duplicate) {
        console.log(`Duplicate detected on attempt ${attempt}, retrying...`)
        if (duplicateResult.duplicateReason) {
          duplicateReasons.push(duplicateResult.duplicateReason)
        }

        if (attempt === maxRetries) {
          return {
            success: false,
            error: `All attempts resulted in duplicates: ${attempt}`,
          }
        }
        continue // 次の試行へ
      }

      return { success: true, data: { ...g, attempts: attempt } }
    }
  }

  return {
    success: false,
    error: 'Unexpected error: exceeded maximum retries',
  }
}
