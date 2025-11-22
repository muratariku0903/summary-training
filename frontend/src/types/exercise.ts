import z from 'zod'

export const exerciseEvaluationDetailsSchema = z.object({
  details: z.array(
    z
      .object({
        perspective: z.string(),
        perspectiveName: z.string(),
        rate: z.number(),
        reason: z.string(),
      })
      .strict(),
  ),
})
export type ExerciseEvaluationDetails = z.infer<typeof exerciseEvaluationDetailsSchema>

export interface ExerciseContent {
  title: string
  description: string
  difficulty: string
  body: string
}
