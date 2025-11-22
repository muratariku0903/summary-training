import { z } from 'zod'

export const requestSchema = z.object({
  input: z.string(),
})

export const responseSchema = z.object({
  evaluationId: z.string(),
  score: z.number(),
  evaluatedDetails: z.array(
    z.object({
      perspective: z.string(),
      perspectiveName: z.string(),
      reason: z.string(),
      rate: z.number(),
    }),
  ),
})

export type ExerciseSubmissionsRequest = z.infer<typeof requestSchema>
export type ExerciseSubmissionsResponse = z.infer<typeof responseSchema>
