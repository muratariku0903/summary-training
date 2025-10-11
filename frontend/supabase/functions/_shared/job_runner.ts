import { logger } from './log/log.ts'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '../_shared/types/database.ts'
import { Result } from './types/common.ts'
import {
  BaseError,
  InvalidRequestError,
  RunJobError,
  UnexpectedError,
} from './error/error.ts'
import { ErrorCategory, ErrorCode } from './error/code.ts'
import { baseRequestSchema, requestParse } from './http/request.ts'

export type RunJobParams = {
  req: Request
  supabase: SupabaseClient<Database>
  jobKey: string
  jobProcess: (
    params: JobProcessParams,
  ) => Promise<Result<JobProcessResponse, JobProcessError>>
  requestId?: string
}
type RunJobResponse = undefined
type JobProcessParams = {
  req: Request
}
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
    insert: number
    update: number
    delete: number
  }[]
  errors: {
    functionName: string
    code: ErrorCode
    category: ErrorCategory
    message: string
  }[]
  profileId?: string
}
type JobProcessError = BaseError
export const runJob = async (
  params: RunJobParams,
): Promise<
  Result<RunJobResponse, InvalidRequestError | RunJobError | UnexpectedError>
> => {
  logger.start(runJob.name)

  const { req, supabase, jobKey, jobProcess, requestId } = params

  // リクエストのバリデーション＆パース
  const {
    success: parseSuccess,
    data: parseData,
    error: parseError,
  } = await requestParse(req, baseRequestSchema)
  if (!parseSuccess) {
    return {
      success: false,
      error: new InvalidRequestError(jobProcess.name, parseError.message),
    }
  }
  const { job_run_mode } = parseData

  try {
    const { error: insertError } = await supabase.from('job_runs').insert({
      job_key: jobKey,
      run_mode: job_run_mode,
      status: 'running',
      request_id: requestId,
    })
    if (insertError) {
      logger.error(runJob.name, insertError)
      return {
        success: false,
        error: new RunJobError(jobKey, 'INSERT', insertError, runJob.name, 'job_runs'),
      }
    }

    const {
      success: jobProcessSuccess,
      data: jobProcessData,
      error: jobProcessError,
    } = await jobProcess({ req })
    if (!jobProcessSuccess) {
      const { error: updateError } = await supabase.from('job_runs').update({
        status: 'failed',
        error_code: jobProcessError.code,
        error_summary: jobProcessError.summary,
        error_detail: jobProcessError.detail,
        finished_at: new Date().toISOString(),
      })
      if (updateError) {
        logger.error(runJob.name, updateError)
        return {
          success: false,
          error: new RunJobError(jobKey, 'UPDATE', updateError, runJob.name, 'job_runs'),
        }
      }
    }

    const { error: updateError } = await supabase.from('job_runs').update({
      status: jobProcessData?.status,
      metrics: jobProcessData?.metrics,
      finished_at: new Date().toISOString(),
    })
    if (updateError) {
      logger.error(runJob.name, updateError)
      return {
        success: false,
        error: new RunJobError(jobKey, 'UPDATE', updateError, runJob.name, 'job_runs'),
      }
    }

    return { success: true, data: undefined }
  } catch (e) {
    logger.error(runJob.name, e)
    return { success: false, error: new UnexpectedError(runJob.name, e) }
  } finally {
    logger.end(runJob.name)
  }
}
