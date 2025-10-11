import { UnknownKeysParam, z, ZodTypeAny } from 'https://esm.sh/zod@3.23.8'
import { logger } from './log/log.ts'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json, Tables } from '../_shared/types/database.ts'
import { Result } from './types/common.ts'
import {
  BaseError,
  InvalidRequestError,
  RunJobError,
  UnexpectedError,
} from './error/error.ts'
import { ErrorCategory, ErrorCode } from './error/code.ts'
import { requestParse } from './http/request.ts'

export type RawShapeOf<T> =
  T extends z.ZodObject<
    infer S extends z.ZodRawShape,
    UnknownKeysParam,
    ZodTypeAny,
    unknown,
    unknown
  >
    ? S
    : never

export type RunJobParams<T extends z.ZodRawShape> = {
  req: Request
  reqSchema: z.ZodObject<T>
  supabase: SupabaseClient<Database>
  jobKey: string
  jobProcess: (
    params: z.infer<z.ZodObject<T>>,
  ) => Promise<Result<JobProcessResponse, JobProcessError>>
  requestId?: string
}
type RunJobResponse = JobProcessResponse

type JobProcessResponse = {
  status: Tables<'job_runs'>['status']
  metrics: JobProcessResponseMetrics
}
type JobProcessResponseMetrics = {
  storage: {
    path: string
    insert: number
    update: number
    delete: number
  }[]
  db: {
    tableName: keyof Database['public']['Tables']
    insert?: string[]
    update?: string[]
    delete?: string[]
  }[]
  errors: {
    functionName: string
    code: ErrorCode
    category: ErrorCategory
    message: string
  }[]
  profileId?: string
  extra?: Json
}
type JobProcessError = BaseError
export const runJob = async <T extends z.ZodRawShape>(
  params: RunJobParams<T>,
): Promise<
  Result<RunJobResponse, InvalidRequestError | RunJobError | UnexpectedError>
> => {
  logger.start(runJob.name)

  const { req, reqSchema, supabase, jobKey, jobProcess, requestId } = params

  // リクエストのバリデーション＆パース
  const {
    success: parseSuccess,
    data: parseData,
    error: parseError,
  } = await requestParse(req, reqSchema)
  if (!parseSuccess) {
    return {
      success: false,
      error: new InvalidRequestError(jobProcess.name, parseError.message),
    }
  }
  const { job_run_mode } = parseData

  try {
    const { data: insertData, error: insertError } = await supabase
      .from('job_runs')
      .insert({
        job_key: jobKey,
        run_mode: job_run_mode,
        status: 'running',
        attempt: 1,
        request_id: requestId,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (insertError) {
      logger.error(runJob.name, insertError)
      return {
        success: false,
        error: new RunJobError(jobKey, 'INSERT', insertError, runJob.name, 'job_runs'),
      }
    }
    const jobRunId = insertData.id

    const {
      success: jobProcessSuccess,
      data: jobProcessData,
      error: jobProcessError,
    } = await jobProcess(parseData)
    if (!jobProcessSuccess) {
      const { error: updateError } = await supabase
        .from('job_runs')
        .update({
          status: 'failed',
          error_code: jobProcessError.code,
          error_summary: jobProcessError.summary,
          error_detail: jobProcessError.detail,
          finished_at: new Date().toISOString(),
        })
        .eq('id', jobRunId)
      if (updateError) {
        logger.error(runJob.name, updateError)
        return {
          success: false,
          error: new RunJobError(jobKey, 'UPDATE', updateError, runJob.name, 'job_runs'),
        }
      }

      return { success: false, error: jobProcessError }
    }

    const { error: updateError } = await supabase
      .from('job_runs')
      .update({
        status: jobProcessData?.status,
        metrics: jobProcessData?.metrics,
        finished_at: new Date().toISOString(),
      })
      .eq('id', jobRunId)
    if (updateError) {
      logger.error(runJob.name, updateError)
      return {
        success: false,
        error: new RunJobError(jobKey, 'UPDATE', updateError, runJob.name, 'job_runs'),
      }
    }

    return { success: true, data: jobProcessData }
  } catch (e) {
    logger.error(runJob.name, e)
    return { success: false, error: new UnexpectedError(runJob.name, e) }
  } finally {
    logger.end(runJob.name)
  }
}
