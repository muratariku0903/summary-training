import { z } from 'zod'
import { baseRequestSchema } from '../_shared/http/request.ts'
import { RawShapeOf, RunJobParams } from '../_shared/job_runner.ts'
import { logger } from '../_shared/log/log.ts'
import { BaseError, UnexpectedError } from '../_shared/error/error.ts'
import { ERROR_CATEGORIES, ERROR_CODES } from '../_shared/error/code.ts'
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
    logger.debug('profile_id: ', profile_id)

    // profileIDから設定情報を取得
    const {
      success: configSuccess,
      data: configData,
      error: configError,
    } = await d.resolveOutputConfigByProfileId(supabase, profile_id)
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
        } = await d.resolveSourcesByProfileId(resolveSourceParams)
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
          } = await d.generateExerciseByLlmFromSourcesParams(generateExerciseParams)
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
          } = await d.saveGeneratedExercise(saveExerciseParams)
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
                          tableName:
                            'exercise_generator_profile_source_patterns' as const,
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
            const { success, error } = await d.deletePattern(
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

  return jobProcess
}

export const jobProcess = createJobProcess()
