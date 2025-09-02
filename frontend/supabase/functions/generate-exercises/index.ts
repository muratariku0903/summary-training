// Deno runtime (Supabase Edge Functions)
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../_shared/types/database.ts'
import { j, ymdJST } from '../_shared/utils/utils.ts'
import { openai } from '../_shared/openai/openai_client.ts'
import OpenAI from 'https://esm.sh/openai@4.55.3/index.js'
import { z } from 'https://esm.sh/zod@3.23.8'

type ExerciseType = Database['public']['Enums']['exercise_type']

// === env ===
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET') // 任意: Scheduler用ヘッダ

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

Deno.serve(async (req) => {
  try {
    // （任意）Scheduler/手動コールの保護
    if (CRON_SECRET) {
      const given = req.headers.get('x-cron-secret')
      if (given !== CRON_SECRET) {
        return j({ ok: false, error: 'unauthorized' }, 401)
      }
    }

    // TODO 以下のパラメーターは外部から指定できるように
    const type: ExerciseType = 'summary'
    const count = 1

    const out: { exercise_id: string; storage_path: string }[] = []
    for (let i = 0; i < count; i++) {
      // 1) 題材を LLM で生成（JSONオブジェクト）
      const {
        success,
        data: generatedExercise,
        error: generateExerciseError,
      } = await generateExercise(openai)
      if (!success) {
        // TODO 異常系
        console.warn('題材生成に失敗しました', generateExerciseError)
        continue
      }

      // 2) Storage へ index.json を保存
      const { yyyy, mm, dd } = ymdJST()
      const id = crypto.randomUUID()
      const path = `${type}/${yyyy}/${mm}/${dd}/${id}/index.json`

      const payload = JSON.stringify(generatedExercise, null, 2)
      const up = await supabase.storage
        .from('exercises')
        .upload(path, new Blob([payload], { type: 'application/json' }), { upsert: true })
      if (up.error) {
        // TODO 異常系
        console.warn('題材のストレージ保存に失敗しました', up.error)
        continue
      }

      // 3) DB 登録（一覧用メタ）
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          status: 'ready',
          exercise_type: type,
          create_type: 'system',
          difficulty: generatedExercise.difficulty,
          title: generatedExercise.title,
          description: generatedExercise.description,
          storage_path: path,
        })
        .select('id')
        .single()
      if (error) {
        // TODO 異常系
        console.warn('題材のDB保存に失敗しました', error)
        continue
      }

      out.push({ exercise_id: data!.id, storage_path: path })
    }

    return j({ ok: true, generated: out })
  } catch (e) {
    console.error(e)
    return j({ ok: false, error: String(e) }, 500)
  }
})

export const exerciseSchema = z
  .object({
    title: z.string().min(1).max(120),
    difficulty: z.coerce.number().int().min(1).max(5),
    description: z.string().max(150),
    body: z.string().min(1),
  })
  .strict()
export type GeneratedExercise = z.infer<typeof exerciseSchema>
async function generateExercise(
  client: OpenAI,
): Promise<
  | { success: true; data: GeneratedExercise; error?: never }
  | { success: false; data?: never; error: string }
> {
  // TODO 以下のスキーマはDBに格納し、外部から指定できるようにする
  const topic = [
    'SupabaseのRLSとポリシー（anon/authenticated権限の設計）',
    'Passkey/WebAuthnとAAL2の要件（TOTP併用・セッション更新）',
    'GitHub Actions × OIDCでAWS AssumeRoleを安全に使う',
    'Playwrightでのメール確認リンクを伴うE2E（Magic Link想定）',
    'Lighthouse CIでLCP/INPを改善するブランチ戦略',
    'HTTP Refererの仕様とプライバシー配慮（Referrer-Policy）',
    'IndexedDBのユースケースと落とし穴（容量・トランザクション）',
  ]

  const system = [
    'あなたは日本語の教材作成者です。',
    '必ず JSON オブジェクトのみを返してください（前後の説明文は禁止）。',
    'title と description には必ず seedTopic に関連するものにしてください',
    `出力スキーマは: {
      "title": "string",
      "difficulty": 1|2|3|4|5,
      "description": "string(<=150)",
      "body": "string",
      }`,
    "禁止事項: 抽象的・汎用的なタイトル（例: '文書要約' '技術解説' 'リライト課題' など）。",
  ].join('\n')

  const user = [
    `題材タイプ: summary`,
    `seedTopic: ${topic}`,
    '- summary: 長文本文(body)を与え、50/150/400字要約の訓練対象になる題材を生成',
    '- explain: 技術トピックを選び、3ペルソナ（非エンジニア上司/新人エンジニア/CTO）に説明できる題材を生成',
    '- rewrite: 読みにくい日本語(body)をわざと提示し、読みやすくリライトする題材を生成',
    '難易度は1〜5。descriptionは150字以内。',
  ].join('\n')

  const res = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 900,
    messages: [
      // AIに全体的な指示や役割、振る舞いを伝えるため
      { role: 'system', content: system },
      // ユーザーからの質問や命令を表現
      { role: 'user', content: user },
    ],
  })

  const content = res.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenAI returned no content')

  let json: unknown
  try {
    json = JSON.parse(content)
    console.log(json)
  } catch {
    return { success: false, error: 'Invalid JSON from OpenAI' }
  }

  const { data, error, success } = exerciseSchema.safeParse(json)
  if (!success) {
    const msg = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')

    return { success: false, error: `schema validation failed: ${msg}` }
  }

  const g: GeneratedExercise = {
    title: data.title,
    difficulty: data.difficulty,
    description: data.description,
    body: data.body,
  }

  return { success: true, data: g }
}
