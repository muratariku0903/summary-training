import { NextRequest, NextResponse } from 'next/server'
import { BadRequest, InternalError, Success, Unauthorized } from '@/lib/api/response'
import { getAccessTokenFromHeader, requestParse } from '@/lib/api/utils'
import { adminClient } from '@/lib/supabase/client/adminClient'
import { requestSchema } from './schema'
import {
  evaluateSubmissionByLlm,
  getExercise,
  getExerciseContent,
  getLatestRubricsPerPerspective,
  saveEvaluationResult,
} from '@/lib/features/exercise'

interface PathParams {
  exercise_id: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<PathParams> },
) {
  const { exercise_id: exerciseId } = await params

  try {
    // 認証ヘッダーからアクセストークンを取得
    const accessToken = getAccessTokenFromHeader(req)
    if (!accessToken) {
      console.error('❌ No valid authorization header')
      return Unauthorized({ msg: 'Authorization header required' }).toResponse()
    }

    // アクセストークンからユーザー情報を取得
    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(accessToken)
    if (userError || !user) {
      return Unauthorized({ msg: 'Invalid access token' }).toResponse()
    }

    // リクエストのバリデーション＆パース
    const { success: parseSuccess, data: parseData } = await requestParse(
      req,
      requestSchema,
    )
    if (!parseSuccess) {
      return BadRequest().toResponse()
    }
    const { input } = parseData

    // 演習データ取得
    const { data: exerciseData, error: exerciseError } = await getExercise({
      id: exerciseId,
      opt: { client: adminClient },
    })
    if (exerciseError || !exerciseData) {
      console.error('exercise fetch error', exerciseError)
      return InternalError().toResponse()
    }
    const { exercise } = exerciseData
    const { data: contentData, error: contentError } = await getExerciseContent({
      storagePath: exercise.storage_path,
      opt: { client: adminClient },
    })
    if (contentError || !contentData) {
      console.error('exercise content fetch error', contentError)
      return InternalError().toResponse()
    }
    const { content } = contentData

    // 最新versionの評価観点取得
    const { data: rubricsData, error: rubricsError } =
      await getLatestRubricsPerPerspective({
        exerciseType: exercise.exercise_type,
        difficulty: exercise.difficulty,
      })
    if (rubricsError || !rubricsData) {
      console.error('rubrics fetch error', rubricsError)
      return InternalError().toResponse()
    }
    const { rubrics } = rubricsData

    // LLMで評価
    const { data: evaluatedData, error: evaluateError } = await evaluateSubmissionByLlm({
      input,
      exercise,
      exerciseBody: content.body,
      rubrics,
    })
    if (evaluateError) {
      console.error('evaluate error', evaluateError)
      return InternalError().toResponse()
    }
    const { score, evaluatedBy, evaluatedDetails } = evaluatedData

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
      console.error('save error', saveError)
      return InternalError().toResponse()
    }
    const { evaluationId } = saveData

    return Success({ evaluationId, score, evaluatedDetails }).toResponse()
  } catch (error) {
    console.error('Error processing submission:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
