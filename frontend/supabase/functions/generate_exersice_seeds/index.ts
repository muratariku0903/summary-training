import { createClient } from '@supabase/supabase-js'
import { z } from 'https://esm.sh/zod@3.23.8'
import type { Database } from '../_shared/types/database.ts'
import {
  generateExerciseSeed,
  generateSeedFromTheme,
  generateSeedFromThemeConfigSchema,
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
      if (given !== CRON_SECRET)
        return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
          status: 401,
        })
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
    if (pErr || !profile) throw new Error('profile not found')
    if (!profile.is_active) throw new Error('profile is not active')

    const { profile_type, config } = profile

    switch (profile_type) {
      case 'ai_theme': {
        const {
          success: parseSuccess,
          data: parseData,
          error: parseError,
        } = generateSeedFromThemeConfigSchema.safeParse(config)
        if (!parseSuccess) {
          throw new Error('invalid config of ai_theme', parseError)
        }

        const {
          success: seedSuccess,
          data: seedData,
          error: seedError,
        } = await generateSeedFromTheme({ client: supabase, config: parseData })
        if (!seedSuccess) {
          throw new Error(`fail generate seed data from theme: ${seedError}`)
        }

        const {
          success: generateSuccess,
          data: generateData,
          error: generateError,
        } = await generateExerciseSeed({
          client: supabase,
          profileId: profile_id,
          seedData,
        })
        if (!generateSuccess) {
          throw new Error(`fail generate exercise seed: ${generateError}`)
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
