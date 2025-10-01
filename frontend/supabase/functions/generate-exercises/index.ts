// Deno runtime (Supabase Edge Functions)
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../_shared/types/database.ts'
import { jsonOk, jsonErr } from '../_shared/http/http.ts'
import { z } from 'https://esm.sh/zod@3.23.8'
import { requestParse } from '../_shared/http/request.ts'
import {
  generateExerciseByLlmFromSourcesParams,
  resolveOutputConfigByProfileId,
  resolveSourcesByProfileId,
  saveGeneratedExercise,
} from '../_shared/usecase/generate_exercises/generate_exercises.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const reqSchema = z.object({
  profile_id: z.string().uuid(),
})

Deno.serve(async (req) => {
  try {
    // （任意）Scheduler/手動コールの保護
    if (CRON_SECRET) {
      const given = req.headers.get('x-cron-secret')
      if (given !== CRON_SECRET) {
        return jsonErr({ ok: false, error: 'unauthorized' }, 401)
      }
    }

    // リクエストのバリデーション＆パース
    const {
      success: parseSuccess,
      data: parseData,
      error: parseError,
    } = await requestParse(req, reqSchema)
    if (!parseSuccess) {
      return jsonErr({ ok: false, error: parseError.message }, 400)
    }
    const { profile_id } = parseData

    // profileIDから設定情報を取得
    const {
      success: configSuccess,
      data: configData,
      error: configError,
    } = await resolveOutputConfigByProfileId(supabase, profile_id)
    if (!configSuccess) {
      return jsonErr({ ok: false, error: configError.message }, 500)
    }
    if (!configData) {
      return jsonErr({ ok: false, error: 'config data is null.' }, 500)
    }
    console.log('configData: ', configData)
    const {
      output_config,
      source_combo_min,
      source_combo_max,
      allow_repeat_when_exhausted,
    } = configData

    switch (output_config.exercise_type) {
      case 'summary': {
        // 題材生成元のソースを探す
        const resolveSourceParams = {
          supabase,
          profileId: profile_id,
          sourceCombMin: source_combo_min,
          sourceCombMax: source_combo_max,
          allowRepeatWhenExhausted: allow_repeat_when_exhausted,
        }
        const {
          success: resolveSourceSuccess,
          data: resolveSourceData,
          error: resolveSourceError,
        } = await resolveSourcesByProfileId(resolveSourceParams)
        if (!resolveSourceSuccess) {
          return jsonErr({ ok: false, error: resolveSourceError.message }, 500)
        }

        // スキーマに従って題材を生成
        const generateExerciseParams = {
          supabase,
          sources: resolveSourceData,
          llm: output_config.schema.llm,
          schema: output_config.schema,
        }
        const {
          success: generateSuccess,
          data: generateData,
          error: generateError,
        } = await generateExerciseByLlmFromSourcesParams(generateExerciseParams)
        if (!generateSuccess) {
          return jsonErr({ ok: false, error: generateError.message }, 500)
        }

        // 生成された題材をDBとストレージに保存
        const saveExerciseParams = {
          supabase,
          exercise: {
            title: generateData.title,
            difficulty: output_config.difficulty,
            description: generateData.description,
            body: generateData.body,
          },
          exerciseType: output_config.exercise_type,
          profileId: profile_id,
        }
        const {
          success: saveSuccess,
          data: saveData,
          error: saveError,
        } = await saveGeneratedExercise(saveExerciseParams)
        if (!saveSuccess) {
          return jsonErr({ ok: false, error: saveError.message }, 500)
        }

        return jsonOk({ ok: true, saveData })
      }

      default:
        return jsonErr(
          {
            ok: false,
            error: `unsupported exercise_type: ${output_config.exercise_type}`,
          },
          400,
        )
    }
  } catch (e) {
    console.error(e)
    return jsonErr({ ok: false, error: String(e) }, 500)
  }
})
