// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod'
import { Json } from './database.ts'
import { BaseError } from '../error/error.ts'
// Result型の定義
export type Result<T, E = Error> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E }
/**
 * 関数型からResult型の成功時のデータ型を抽出する型関数
 */
export type ExtractResultData<T> = T extends (
  ...args: any[]
) => Promise<Result<infer D, any>>
  ? D
  : T extends (...args: any[]) => Result<infer D, any>
    ? D
    : never

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
) => Promise<Result<LlmExerciseGeneratorResponse, BaseError>>
