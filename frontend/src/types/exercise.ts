import z from 'zod'

export const exerciseEvaluationDetailsSchema = z
  .object({
    details: z.array(
      z
        .object({
          perspective: z.string(),
          perspectiveName: z.string(),
          rate: z.number().min(0.0).max(1.0),
          reason: z.string(),
        })
        .strict(),
    ),
  })
  .strict()
export type ExerciseEvaluationDetails = z.infer<typeof exerciseEvaluationDetailsSchema>

export interface ExerciseContent {
  title: string
  description: string
  difficulty: string
  body: string
}
