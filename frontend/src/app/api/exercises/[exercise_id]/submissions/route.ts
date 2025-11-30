import { BadRequest, InternalError, Success } from '@/lib/api/response'
import { requestParse } from '@/lib/api/utils'
import { adminClient } from '@/lib/supabase/client/adminClient'
import {
  evaluateSubmissionByLlm,
  getExercise,
  getExerciseContent,
  getLatestRubricsPerPerspective,
  saveEvaluationResult,
} from '@/lib/features/exercise/server'
import { withAuth, withLogger } from '@/lib/api/wrapper'
import { requestSchema } from './schema'
import { LOG_MESSAGES } from '@/lib/log/message'

interface PathParams {
  exercise_id: string
}

export const POST = withLogger(
  withAuth<PathParams>(async (req, user, { params, logger }) => {
    const { exercise_id: exerciseId } = await params
    logger.setContext({ exerciseId })

    logger.info(LOG_MESSAGES.PROCESSING.STARTED)

    try {
      // リクエストのバリデーション＆パース
      const {
        success: parseSuccess,
        data: parseData,
        error: parseError,
      } = await requestParse(req, requestSchema)
      if (!parseSuccess) {
        const msg = LOG_MESSAGES.VALIDATION.INVALID_REQUEST
        logger.warn(msg, { errorDetails: parseError?.message })
        return BadRequest({ details: parseError }).toResponse()
      }
      const { input } = parseData

      // 演習データ取得
      const { data: exerciseData, error: exerciseError } = await getExercise({
        id: exerciseId,
        opt: { client: adminClient },
      })
      if (exerciseError || !exerciseData) {
        const msg = LOG_MESSAGES.RESOURCE.EXERCISE_FETCH_FAILED
        logger.error(msg, exerciseError)
        return InternalError({ msg, details: exerciseError }).toResponse()
      }
      const { exercise } = exerciseData
      logger.debug(LOG_MESSAGES.RESOURCE.EXERCISE_FETCHED, {
        exerciseType: exercise.exercise_type,
        difficulty: exercise.difficulty,
      })

      const { data: contentData, error: contentError } = await getExerciseContent({
        storagePath: exercise.storage_path,
        opt: { client: adminClient },
      })
      if (contentError || !contentData) {
        const msg = LOG_MESSAGES.RESOURCE.EXERCISE_CONTENT_FETCH_FAILED
        logger.error(msg, contentError)
        return InternalError({ msg, details: contentError }).toResponse()
      }
      const { content } = contentData
      logger.debug(LOG_MESSAGES.RESOURCE.EXERCISE_CONTENT_FETCHED)

      // 最新versionの評価観点取得
      const { data: rubricsData, error: rubricsError } =
        await getLatestRubricsPerPerspective({
          exerciseType: exercise.exercise_type,
          difficulty: exercise.difficulty,
        })
      if (rubricsError || !rubricsData) {
        const msg = LOG_MESSAGES.RESOURCE.RUBRICS_FETCH_FAILED
        logger.error(msg, rubricsError)
        return InternalError({ msg, details: rubricsError }).toResponse()
      }
      const { rubrics } = rubricsData
      logger.debug(LOG_MESSAGES.RESOURCE.RUBRICS_FETCHED)

      // LLMで評価
      const { data: evaluatedData, error: evaluateError } = await evaluateSubmissionByLlm(
        {
          input,
          exercise,
          exerciseBody: content.body,
          rubrics,
        },
      )
      if (evaluateError) {
        const msg = LOG_MESSAGES.PROCESSING.LLM_EVALUATION_FAILED
        logger.error(msg, evaluateError)
        return InternalError({ msg, details: evaluateError }).toResponse()
      }
      const { score, evaluatedBy, evaluatedDetails } = evaluatedData
      logger.info(LOG_MESSAGES.PROCESSING.LLM_EVALUATION_COMPLETED, {
        score,
        evaluatedBy,
      })

      // 評価結果を結果をDBに保存
      const { data: saveData, error: saveError } = await saveEvaluationResult({
        exerciseId,
        userId: user.id,
        input,
        score,
        evaluatedBy,
        evaluatedDetails,
        rubrics,
      })
      if (saveError) {
        const msg = LOG_MESSAGES.PROCESSING.SAVE_RESULT_FAILED
        logger.error(msg, saveError)
        return InternalError({ msg, details: saveError }).toResponse()
      }
      const { evaluationId } = saveData
      logger.info(LOG_MESSAGES.PROCESSING.SAVE_RESULT_COMPLETED, {
        evaluationId,
      })

      logger.info(LOG_MESSAGES.PROCESSING.COMPLETED, {
        evaluationId,
        score,
      })
      return Success({ evaluationId, score, evaluatedDetails }).toResponse()
    } catch (error) {
      const msg = LOG_MESSAGES.PROCESSING.UNEXPECTED_ERROR
      logger.error(msg, error)
      return InternalError({ msg, details: error }).toResponse()
    }
  }),
)
