import { z } from 'https://esm.sh/zod@3.23.8'
import { baseRequestSchema } from '../_shared/http/request.ts'
import { RawShapeOf, RunJobParams } from '../_shared/job_runner.ts'
import { logger } from '../_shared/log/log.ts'
import { InvalidRequestError, UnexpectedError } from '../_shared/error/error.ts'
import { deps } from './deps.ts'

export const reqSchema = baseRequestSchema.extend({
  profile_id: z.string().uuid(),
})
export type ShapeOfReqSchema = RawShapeOf<typeof reqSchema>

export const createJobProcess = (d = deps) => {
  const jobProcess: RunJobParams<ShapeOfReqSchema>['jobProcess'] = async (
    supabase,
    params,
  ) => {
    const { profile_id } = params

    // プロファイル取得
    const {
      success,
      data: profile,
      error,
    } = await d.getActiveProfileById({
      client: supabase,
      profileId: profile_id,
    })
    if (!success) {
      logger.error('プロファイルの取得に失敗しました', error)
      return { success: false, error }
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
        } = d.generateSeedFromThemeConfigSchema.safeParse(config)
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
        } = await d.generateSeedDataFromTheme({ client: supabase, config: parseData })
        if (!seedSuccess) {
          logger.error('SEED生成に失敗しました', seedError)
          return { success: false, error: seedError }
        }

        const {
          success: saveSuccess,
          data: saveData,
          error: saveError,
        } = await d.saveSeed({
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
              db: [
                {
                  tableName: 'exercise_generator_seeds',
                  insert: [saveData.seed_id],
                },
              ],
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

  return jobProcess
}

export const jobProcess = createJobProcess()
