import { jsonOk, jsonErr } from '../_shared/http/http.ts'
import { z } from 'https://esm.sh/zod@3.23.8'
import { baseRequestSchema } from '../_shared/http/request.ts'
import {
  generateExerciseByLlmFromSourcesParams,
  resolveOutputConfigByProfileId,
  resolveSourcesByProfileId,
  saveGeneratedExercise,
} from '../_shared/usecase/generate_exercises/generate_exercises.ts'
import { deletePattern } from '../_shared/repository/exercise_generator_source_patterns.ts'
import { logger } from '../_shared/log/log.ts'
import {
  BaseError,
  InvalidRequestError,
  UnexpectedError,
} from '../_shared/error/error.ts'
import { RawShapeOf, runJob, RunJobParams } from '../_shared/job_runner.ts'
import { JOB_NAMES } from '../_shared/const.ts'
import { ERROR_CATEGORIES, ERROR_CODES } from '../_shared/error/code.ts'
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
      jobKey: JOB_NAMES.GENERATE_EXERCISES,
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
  logger.debug('profile_id: ', profile_id)

  // profileIDから設定情報を取得
  const {
    success: configSuccess,
    data: configData,
    error: configError,
  } = await resolveOutputConfigByProfileId(supabase, profile_id)
  if (!configSuccess) {
    return { success: false, error: configError }
  }
  if (!configData) {
    return {
      success: false,
      error: new UnexpectedError(
        jobProcess.name,
        '題材生成出力設定情報(configData)が取得できませんでした',
      ),
    }
  }
  logger.debug('configData: ', configData)
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
        if (resolveSourceError.code === ERROR_CODES.UNUSED_SOURCE_PATTERN_NOT_FOUND) {
          return {
            success: true,
            data: {
              status: 'warn',
              metrics: {
                profileId: profile_id,
                errors: [
                  {
                    functionName: jobProcess.name,
                    code: ERROR_CODES.UNUSED_SOURCE_PATTERN_NOT_FOUND,
                    category: ERROR_CATEGORIES.BUSINESS_LOGIC_ERROR,
                  },
                ],
              },
            },
          }
        }

        return { success: false, error: resolveSourceError }
      }

      try {
        // スキーマに従って題材を生成
        const generateExerciseParams = {
          supabase,
          sources: resolveSourceData.sources,
          llm: output_config.schema.llm,
          schema: output_config.schema,
        }
        const {
          success: generateSuccess,
          data: generateData,
          error: generateError,
        } = await generateExerciseByLlmFromSourcesParams(generateExerciseParams)
        if (!generateSuccess) {
          throw generateError
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
          throw saveError
        }

        return {
          success: true,
          data: {
            status: 'success',
            metrics: {
              profileId: profile_id,
              db: [
                ...(resolveSourceData.patternId
                  ? [
                      {
                        tableName: 'exercise_generator_profile_source_patterns' as const,
                        insert: [resolveSourceData.patternId],
                      },
                    ]
                  : []),
                { tableName: 'exercises', insert: [saveData.exerciseId] },
              ],
              storage: [{ insert: saveData.storagePath }],
            },
          },
        }
      } catch (error) {
        logger.error('題材生成処理に失敗しました', error)
        if (resolveSourceData.patternId) {
          // パターンが新たに生成されていた場合は削除しておく
          const { success, error } = await deletePattern(
            supabase,
            resolveSourceData.patternId,
          )
          if (!success) {
            logger.error(
              `ソースパターン:${resolveSourceData.patternId}の削除に失敗しました`,
              error,
            )
          }
        }

        return {
          success: false,
          error:
            error instanceof BaseError
              ? error
              : new UnexpectedError(jobProcess.name, error),
        }
      }
    }

    default:
      return {
        success: false,
        error: new UnexpectedError(
          jobProcess.name,
          `想定外の題材種別が指定されました exercise_type: ${output_config.exercise_type}`,
        ),
      }
  }
}
