import { z } from 'https://esm.sh/zod@3.23.8'
import { Json } from './database.ts'
// Result型の定義
export type Result<T, E = Error> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E }

export const llmExerciseGeneratorResponseSchema = z
  .object({
    title: z.string().min(1).max(120),
    description: z.string().max(150),
    body: z.string().min(1),
  })
  .strict()
export type LlmExerciseGeneratorResponse = z.infer<
  typeof llmExerciseGeneratorResponseSchema
>

export type LlmExerciseGeneratorParams = {
  schema: Json
  model: { name: string; max_tokens: number | null }
  sources: string[]
}
export type LlmExerciseGenerator = (
  params: LlmExerciseGeneratorParams,
) => Promise<Result<LlmExerciseGeneratorResponse>>
