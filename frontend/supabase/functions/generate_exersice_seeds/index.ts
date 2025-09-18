import { createClient } from '@supabase/supabase-js'
import { z } from 'https://esm.sh/zod@3.23.8'
import type { Database } from '../_shared/types/database.ts'
import {
  generateSeedDataFromTheme,
  generateSeedFromThemeConfigSchema,
  saveSeed,
} from './_shared/seed_generator.ts'
import { jsonErr, jsonOk } from '../_shared/http/http.ts'

// ---- env
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const reqSchema = z.object({
  profile_id: z.string().uuid(),
})

Deno.serve(async (req) => {
  try {
    if (CRON_SECRET) {
      const given = req.headers.get('x-cron-secret')
      if (given !== CRON_SECRET) {
        return jsonErr({ ok: false, error: 'unauthorized' }, 401)
      }
    }

    console.log('req: ', req)
    const body = await req
      .json()
      .catch(() => console.error('fail to json from request', req))
    const {
      success: parseSuccess,
      data: parseData,
      error: parseError,
    } = reqSchema.safeParse(body)
    if (!parseSuccess) {
      return jsonErr({ ok: false, error: String(parseError) }, 400)
    }
    const { profile_id } = parseData

    // プロファイル取得
    const { data: profile, error: pErr } = await supabase
      .from('seed_generator_profiles')
      .select('*')
      .eq('id', profile_id)
      .single()
    if (pErr || !profile) {
      return jsonErr({ ok: false, error: 'profile not found' }, 404)
    }
    if (!profile.is_active) {
      return jsonErr({ ok: false, error: 'profile is not active' }, 400)
    }

    const { profile_type, config } = profile
    console.log('profile_type: ', profile_type)
    console.log('config: ', config)

    switch (profile_type) {
      case 'ai_theme': {
        const {
          success: parseSuccess,
          data: parseData,
          error: parseError,
        } = generateSeedFromThemeConfigSchema.safeParse(config)
        if (!parseSuccess) {
          return jsonErr(
            { ok: false, error: `invalid config of ai_theme: ${parseError}` },
            400,
          )
        }

        const {
          success: seedSuccess,
          data: seedData,
          error: seedError,
        } = await generateSeedDataFromTheme({ client: supabase, config: parseData })
        if (!seedSuccess) {
          return jsonErr(
            { ok: false, error: `fail generate seed data from theme: ${seedError}` },
            500,
          )
        }
        console.log('generate seed data success')

        const {
          success: generateSuccess,
          data: generateData,
          error: generateError,
        } = await saveSeed({
          client: supabase,
          profileId: profile_id,
          themeId: seedData.themeId,
          llmId: seedData.llmId,
          seedData: seedData.result,
        })
        if (!generateSuccess) {
          return jsonErr(
            { ok: false, error: `fail generate exercise seed: ${generateError}` },
            500,
          )
        }

        return jsonOk({ ok: true, seed_id: generateData.seed_id })
      }

      default:
        console.log('wip')
        return jsonOk({ ok: true, seed_id: null })
    }
  } catch (e) {
    console.error('unexpected error', e)
    return jsonErr({ ok: false, error: String(e) }, 500)
  }
})
