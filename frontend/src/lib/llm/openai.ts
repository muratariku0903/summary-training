import OpenAI from 'openai'
import { Exercise, ExerciseEvaluationRubrics, LlmVendor } from '../supabase/schema/utils'
import { Result } from '@/types/common'
import {
  ExerciseEvaluationDetails,
  exerciseEvaluationDetailsSchema,
} from '@/types/exercise'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? 'dummy' })

type EvaluateAccordingToRubricsParams = {
  input: string
  exercise: Exercise
  exerciseBody: string
  rubrics: ExerciseEvaluationRubrics[]
  model?: string
}
type EvaluateAccordingToRubricsResponse = {
  evaluatedBy: { vendor: LlmVendor; model: string }
  details: ExerciseEvaluationDetails['details']
  rubrics: ExerciseEvaluationRubrics[]
}
export async function evaluateAccordingToRubrics(
  params: EvaluateAccordingToRubricsParams,
): Promise<Result<EvaluateAccordingToRubricsResponse>> {
  const { input, exercise, exerciseBody, rubrics, model = 'gpt-4o' } = params

  const system = `
あなたは厳格な採点者です。各評価観点ごとに0.0〜1.0の達成率と簡潔な理由を返してください。
必ず指示したJSONスキーマのみを出力してください。`.trim()

  const user = {
    exercise: {
      title: exercise.title,
      description: exercise.description,
      body: exerciseBody,
    },
    rubrics: rubrics,
    submission: input,
    output_schema: {
      type: 'object',
      properties: {
        details: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              perspective: { type: 'string' },
              perspectiveName: { type: 'string' },
              rate: { type: 'number' }, // 0.0〜1.0
              reason: { type: 'string' },
            },
            required: ['perspective', 'perspectiveName', 'rate', 'reason'],
          },
        },
      },
      required: ['details'],
    },
    instruction:
      'rubrics配列の順序と同じ順序でdetailsを返し、各rateは0.0〜1.0に収めてください。出力はJSONのみ。',
  }

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(user) },
      ],
    })

    const content = completion.choices[0]?.message?.content ?? ''
    console.log('content: ', content)
    const parsed = JSON.parse(content)

    const { data, error, success } = exerciseEvaluationDetailsSchema.safeParse(parsed)
    if (!success) {
      const msg = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      return {
        success: false,
        error: new Error(`llm evaluation schema validation failed: ${msg}`),
      }
    }

    return {
      success: true,
      data: {
        evaluatedBy: {
          vendor: 'openai',
          model: model,
        },
        details: data.details,
        rubrics,
      },
    }
  } catch (e) {
    console.error('fail llm evaluated', e)
    return { success: false, error: new Error('fail llm evaluated') }
  }
}
