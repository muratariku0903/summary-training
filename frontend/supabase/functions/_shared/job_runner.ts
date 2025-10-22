import { UnknownKeysParam, z, ZodTypeAny } from 'https://esm.sh/zod@3.23.8'
import { logger } from './log/log.ts'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json, Tables } from '../_shared/types/database.ts'
import { Result } from './types/common.ts'
import {
  BaseError,
  DatabaseQueryError,
  InvalidRequestError,
  OperationError,
  UnexpectedError,
} from './error/error.ts'
import { ERROR_CODES, ErrorCategory, ErrorCode } from './error/code.ts'
import { requestParse } from './http/request.ts'
import { JobName } from './const.ts'

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
  jobKey: JobName
  jobProcess: (
    supabase: SupabaseClient<Database>,
    params: z.infer<z.ZodObject<T>>,
  ) => Promise<Result<JobProcessResponse, JobProcessError>>
  requestId?: string
  enableMultiJob?: boolean
  disableConcurrentlyRunJobs?: JobName[]
}
type RunJobResponse = JobProcessResponse

type JobProcessResponse = {
  status: Tables<'job_runs'>['status']
  metrics: JobProcessResponseMetrics
}
type JobProcessResponseMetrics = {
  storage?: {
    insert?: string
    update?: string
    delete?: string
  }[]
  db?: {
    tableName: keyof Database['public']['Tables']
    insert?: string[]
    update?: string[]
    delete?: string[]
  }[]
  errors?: {
    functionName: string
    code: ErrorCode
    category: ErrorCategory
    message?: string
  }[]
  profileId?: string
  extra?: Json
}
type JobProcessError = BaseError
export const runJob = async <T extends z.ZodRawShape>(
  params: RunJobParams<T>,
): Promise<
  Result<
    RunJobResponse,
    InvalidRequestError | DatabaseQueryError | UnexpectedError | BaseError
  >
> => {
  logger.start(runJob.name)

  const {
    req,
    reqSchema,
    supabase,
    jobKey,
    jobProcess,
    requestId,
    enableMultiJob,
    disableConcurrentlyRunJobs,
  } = params

  // 多重実行を禁止してる場合は他に同じジョブが実行中かチェック
  if (!enableMultiJob) {
    const { data, error } = await supabase
      .from('job_runs')
      .select('*')
      .eq('job_key', jobKey)
      .eq('status', 'running')
      .limit(1)
    if (error) {
      return {
        success: false,
        error: new DatabaseQueryError(runJob.name, 'SELECT', 'job_runs', error.message),
      }
    }
    if (data && data.length > 0) {
      const existingJob = data[0]
      const message = {
        jobKey,
        runningJobId: existingJob.id,
        startedAt: existingJob.started_at,
      }
      logger.warn(`${runJob.name}: ジョブが既に実行中です`, message)
      return {
        success: false,
        error: new OperationError(
          runJob.name,
          ERROR_CODES.JOB_ALREADY_RUNNING,
          'ジョブが既に実行中です',
          `jobKey: ${jobKey}, jobId: ${existingJob.id}, startAt: ${existingJob.started_at}`,
        ),
      }
    }
  }

  // 平行処理してほくしないバッチが指定されてる場合はそれも実行中かチェック
  if (disableConcurrentlyRunJobs) {
    const { data, error } = await supabase
      .from('job_runs')
      .select('*')
      .in('job_key', disableConcurrentlyRunJobs)
      .eq('status', 'running')
    if (error) {
      return {
        success: false,
        error: new DatabaseQueryError(runJob.name, 'SELECT', 'job_runs', error.message),
      }
    }
    if (data && data.length > 0) {
      const message = {
        jobKey,
        runningJobIds: data.map((d) => d.job_key).join(','),
      }
      logger.warn(`${runJob.name}: 禁止された同時実行ジョブが稼働中のため停止`, message)
      return {
        success: false,
        error: new OperationError(
          runJob.name,
          ERROR_CODES.JOB_BLOCKED_BY_OTHER_RUNNING_JOBS,
          '禁止された同時実行ジョブが稼働中です',
          `blockingJobs: ${disableConcurrentlyRunJobs.join(', ')}`,
        ),
      }
    }
  }

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
        error: new DatabaseQueryError(
          runJob.name,
          'INSERT',
          'job_runs',
          insertError.message,
        ),
      }
    }
    const jobRunId = insertData.id

    const {
      success: jobProcessSuccess,
      data: jobProcessData,
      error: jobProcessError,
    } = await jobProcess(supabase, parseData)
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
          error: new DatabaseQueryError(
            runJob.name,
            'UPDATE',
            'job_runs',
            jobProcessError.message,
          ),
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
        error: new DatabaseQueryError(
          runJob.name,
          'UPDATE',
          'job_runs',
          updateError.message,
        ),
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
