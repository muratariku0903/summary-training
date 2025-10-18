import { z } from 'https://esm.sh/zod@3.23.8'
import { jsonErr, jsonOk } from '../_shared/http/http.ts'
import { baseRequestSchema } from '../_shared/http/request.ts'
import { RawShapeOf, runJob, RunJobParams } from '../_shared/job_runner.ts'
import { logger } from '../_shared/log/log.ts'
import {
  DatabaseQueryError,
  InvalidRequestError,
  OperationError,
  UnexpectedError,
} from '../_shared/error/error.ts'
import { ERROR_CODES } from '../_shared/error/code.ts'
import {
  generateSeedDataFromTheme,
  generateSeedFromThemeConfigSchema,
} from '../_shared/usecase/generate_seeds/generate_seeds.ts'
import { saveSeed } from '../_shared/repository/exercise_generator_seeds.ts'
import { JOB_NAMES } from '../_shared/const.ts'
import { getSupabaseClient } from '../_shared/db/client.ts'

const CRON_SECRET = Deno.env.get('CRON_SECRET')

const reqSchema = baseRequestSchema.extend({
  profile_id: z.string().uuid(),
})
type ShapeOfReqSchema = RawShapeOf<typeof reqSchema>

Deno.serve(async (req) => {
  logger.debug('req: ', req)

  if (CRON_SECRET) {
    const given = req.headers.get('x-cron-secret')
    if (given !== CRON_SECRET) return jsonErr({ ok: false, error: 'unauthorized' }, 401)
  }

  const supabase = getSupabaseClient()

  try {
    const params: RunJobParams<ShapeOfReqSchema> = {
      req,
      supabase,
      reqSchema,
      jobKey: JOB_NAMES.GENERATE_EXERCISE_SEEDS,
      jobProcess,
    }
    const { success, data, error } = await runJob(params)
    if (!success) {
      return jsonErr(error, error instanceof InvalidRequestError ? 400 : 500)
    }

    return jsonOk({ data })
  } catch (e) {
    logger.error('想定外のエラー', e)
    return jsonErr(e, 500)
  }
})

const jobProcess: RunJobParams<ShapeOfReqSchema>['jobProcess'] = async (
  supabase,
  params,
) => {
  const { profile_id } = params

  // プロファイル取得
  const { data: profile, error: pErr } = await supabase
    .from('seed_generator_profiles')
    .select('*')
    .eq('id', profile_id)
    .single()
  if (pErr || !profile) {
    return {
      success: false,
      error: new DatabaseQueryError(jobProcess.name, 'SELECT', 'seed_generator_profiles'),
    }
  }
  if (!profile.is_active) {
    return {
      success: false,
      error: new OperationError(
        jobProcess.name,
        ERROR_CODES.RECORD_NOT_ACTIVE,
        '指定されたプロファイルが無効です',
        `profile_id: ${profile_id} table: seed_generator_profiles`,
      ),
    }
  }

  const { profile_type, config } = profile
  logger.debug('profile_type: ', profile_type)
  logger.debug('config: ', config)

  switch (profile_type) {
    case 'ai_theme': {
      const {
        success: parseSuccess,
        data: parseData,
        error: parseError,
      } = generateSeedFromThemeConfigSchema.safeParse(config)
      if (!parseSuccess) {
        return {
          success: false,
          error: new InvalidRequestError(jobProcess.name, parseError.message),
        }
      }

      const {
        success: seedSuccess,
        data: seedData,
        error: seedError,
      } = await generateSeedDataFromTheme({ client: supabase, config: parseData })
      if (!seedSuccess) {
        logger.error('SEED生成に失敗しました', seedError)
        return { success: false, error: seedError }
      }

      const {
        success: saveSuccess,
        data: saveData,
        error: saveError,
      } = await saveSeed({
        client: supabase,
        profileId: profile_id,
        themeId: seedData.themeId,
        llmId: seedData.llmId,
        seedData: seedData.result,
      })
      if (!saveSuccess) {
        logger.error('SEED保存に失敗しました', seedError)
        return { success: false, error: saveError }
      }

      return {
        success: true,
        data: {
          status: 'success',
          metrics: {
            profileId: profile_id,
            storage: [],
            db: [
              {
                tableName: 'exercise_generator_seeds',
                insert: [saveData.seed_id],
              },
            ],
            errors: [],
          },
        },
      }
    }

    default:
      return {
        success: false,
        error: new UnexpectedError(
          jobProcess.name,
          `想定外のプロファイル種別が指定されました profile_type: ${profile_type}`,
        ),
      }
  }
}
