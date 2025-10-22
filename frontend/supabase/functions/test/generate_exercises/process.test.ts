/* eslint-disable @typescript-eslint/no-unused-vars */
// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference lib="deno.ns" />

import {
  assertEquals,
  assertInstanceOf,
} from 'https://deno.land/std@0.208.0/assert/mod.ts'
import {
  spy,
  assertSpyCall,
  assertSpyCalls,
} from 'https://deno.land/std@0.208.0/testing/mock.ts'
import { createJobProcess } from '../../../functions/generate-exercises/process.ts'
import {
  OperationError,
  UnexpectedError,
} from '../../../functions/_shared/error/error.ts'
import { ERROR_CATEGORIES, ERROR_CODES } from '../../../functions/_shared/error/code.ts'
import {
  GenerateExerciseByLlmFromSourcesResponse,
  GenerateExerciseOutputConfigByProfileIdResponse,
  resolveOutputConfigByProfileId,
  ResolveSourcesResponse,
  SaveGeneratedExerciseResponse,
} from '../../_shared/usecase/generate_exercises/generate_exercises.ts'
import { DeletePatternResponse } from '../../_shared/repository/exercise_generator_source_patterns.ts'

Deno.test('generate-exercises/process.ts', async (t) => {
  const supabase = {} as any
  const profileId = '00000000-0000-0000-0000-000000000000'

  await t.step(
    '正常系: ランダムに未選択のソース選択して題材の生成と保存に成功 → status = success',
    async () => {
      const baseConfigData: GenerateExerciseOutputConfigByProfileIdResponse = {
        id: 'id',
        name: 'name',
        description: 'description',
        is_active: true,
        output_config_id: 'output_config_id',
        output_config: {
          id: 'id',
          name: 'name',
          description: 'description',
          exercise_type: 'summary',
          data_type: 'text',
          difficulty: 'easy',
          llm_id: 'llm-1',
          schema: {
            data_type: 'text',
            exercise_type: 'summary',
            difficulty: 'easy',
            llm_id: 'llm-1',
            updated_at: '',
            created_at: '',
            schema: { user: 'user prompt', system: 'system prompt' },
            llm: {
              id: 'llm-1',
              vendor: 'openai',
              model: 'gpt-4o',
              max_tokens: 8192,
              created_at: '',
              updated_at: '',
              meta: {},
              is_active: true,
            },
          },
          created_at: '',
          updated_at: '',
        },
        source_combo_min: 1,
        source_combo_max: 2,
        allow_repeat_when_exhausted: false,
        created_at: '',
        updated_at: '',
      }
      const resolvedSources: ResolveSourcesResponse = {
        patternId: 'patternId',
        sources: [
          {
            id: 'source_id',
            title: 'title',
            description: 'description',
            aggregate_type: 'theme',
            theme_id: 'theme_id',
            is_active: true,
            created_at: '',
            updated_at: '',
          },
          {
            id: 'source_id',
            title: 'title',
            description: 'description',
            aggregate_type: 'theme',
            theme_id: 'theme_id',
            is_active: true,
            created_at: '',
            updated_at: '',
          },
        ],
      }
      const generatedExercise: GenerateExerciseByLlmFromSourcesResponse = {
        title: 't',
        description: 'd',
        body: 'b',
      }
      const saveResult: SaveGeneratedExerciseResponse = {
        exerciseId: 'ex-1',
        storagePath: '/storage/ex-1.json',
        exercise: {
          id: 'id',
          title: 'title',
          generate_profile_id: 'generate_profile_id',
          status: 'ready',
          storage_path: '/storage/ex-1.json',
          exercise_type: 'summary',
          difficulty: 'easy',
          create_type: 'system',
          created_at: '',
          created_by: '',
          updated_at: '',
          delete_flg: false,
          description: 'description',
        },
      }
      const deletePatternResult: DeletePatternResponse = {
        id: 'id',
        deleted_at: '',
      }
      const fakeDeps = {
        resolveOutputConfigByProfileId: (_: any) =>
          Promise.resolve({
            success: true as const,
            data: baseConfigData,
          }),
        resolveSourcesByProfileId: (_: any) =>
          Promise.resolve({
            success: true as const,
            data: resolvedSources,
          }),
        generateExerciseByLlmFromSourcesParams: (_: any) =>
          Promise.resolve({
            success: true as const,
            data: generatedExercise,
          }),
        saveGeneratedExercise: (_: any) =>
          Promise.resolve({
            success: true as const,
            data: saveResult,
          }),
        deletePattern: (_: any) =>
          Promise.resolve({ success: true as const, data: deletePatternResult }),
      }

      const jobProcess = createJobProcess(fakeDeps)
      const res = await jobProcess(supabase, {
        job_run_mode: 'test',
        profile_id: profileId,
      })

      assertEquals(res.success, true)
      if (res.success) {
        assertEquals(res.data.status, 'success')
        assertEquals(res.data.metrics.profileId, profileId)
        assertEquals(res.data.metrics.db, [
          {
            tableName: 'exercise_generator_profile_source_patterns',
            insert: [resolvedSources.patternId ?? ''],
          },
          {
            tableName: 'exercises',
            insert: [saveResult.exerciseId],
          },
        ])
        assertEquals(res.data.metrics.storage, [{ insert: saveResult.storagePath }])
      }
    },
  )
  await t.step(
    '正常系: ランダムに未選択のソース選択せず(patternIdがnull)題材の生成と保存に成功 → status = success',
    async () => {
      const baseConfigData: GenerateExerciseOutputConfigByProfileIdResponse = {
        id: 'id',
        name: 'name',
        description: 'description',
        is_active: true,
        output_config_id: 'output_config_id',
        output_config: {
          id: 'id',
          name: 'name',
          description: 'description',
          exercise_type: 'summary',
          data_type: 'text',
          difficulty: 'easy',
          llm_id: 'llm-1',
          schema: {
            data_type: 'text',
            exercise_type: 'summary',
            difficulty: 'easy',
            llm_id: 'llm-1',
            updated_at: '',
            created_at: '',
            schema: { user: 'user prompt', system: 'system prompt' },
            llm: {
              id: 'llm-1',
              vendor: 'openai',
              model: 'gpt-4o',
              max_tokens: 8192,
              created_at: '',
              updated_at: '',
              meta: {},
              is_active: true,
            },
          },
          created_at: '',
          updated_at: '',
        },
        source_combo_min: 1,
        source_combo_max: 2,
        allow_repeat_when_exhausted: false,
        created_at: '',
        updated_at: '',
      }
      const resolvedSources: ResolveSourcesResponse = {
        patternId: null,
        sources: [
          {
            id: 'source_id',
            title: 'title',
            description: 'description',
            aggregate_type: 'theme',
            theme_id: 'theme_id',
            is_active: true,
            created_at: '',
            updated_at: '',
          },
        ],
      }
      const generatedExercise: GenerateExerciseByLlmFromSourcesResponse = {
        title: 't',
        description: 'd',
        body: 'b',
      }
      const saveResult: SaveGeneratedExerciseResponse = {
        exerciseId: 'ex-1',
        storagePath: '/storage/ex-1.json',
        exercise: {
          id: 'id',
          title: 'title',
          generate_profile_id: 'generate_profile_id',
          status: 'ready',
          storage_path: '/storage/ex-1.json',
          exercise_type: 'summary',
          difficulty: 'easy',
          create_type: 'system',
          created_at: '',
          created_by: '',
          updated_at: '',
          delete_flg: false,
          description: 'description',
        },
      }
      const deletePatternResult: DeletePatternResponse = {
        id: 'id',
        deleted_at: '',
      }
      const fakeDeps = {
        resolveOutputConfigByProfileId: (_: any) =>
          Promise.resolve({
            success: true as const,
            data: baseConfigData,
          }),
        resolveSourcesByProfileId: (_: any) =>
          Promise.resolve({
            success: true as const,
            data: resolvedSources,
          }),
        generateExerciseByLlmFromSourcesParams: (_: any) =>
          Promise.resolve({
            success: true as const,
            data: generatedExercise,
          }),
        saveGeneratedExercise: (_: any) =>
          Promise.resolve({
            success: true as const,
            data: saveResult,
          }),
        deletePattern: (_: any) =>
          Promise.resolve({ success: true as const, data: deletePatternResult }),
      }

      const jobProcess = createJobProcess(fakeDeps)
      const res = await jobProcess(supabase, {
        job_run_mode: 'test',
        profile_id: profileId,
      })

      assertEquals(res.success, true)
      if (res.success) {
        assertEquals(res.data.status, 'success')
        assertEquals(res.data.metrics.profileId, profileId)
        assertEquals(res.data.metrics.db, [
          {
            tableName: 'exercises',
            insert: [saveResult.exerciseId],
          },
        ])
        assertEquals(res.data.metrics.storage, [{ insert: saveResult.storagePath }])
      }
    },
  )

  await t.step('準正常系: UNUSED_SOURCE_PATTERN_NOT_FOUND → status=warn', async () => {
    const baseConfigData: GenerateExerciseOutputConfigByProfileIdResponse = {
      id: 'id',
      name: 'name',
      description: 'description',
      is_active: true,
      output_config_id: 'output_config_id',
      output_config: {
        id: 'id',
        name: 'name',
        description: 'description',
        exercise_type: 'summary',
        data_type: 'text',
        difficulty: 'easy',
        llm_id: 'llm-1',
        schema: {
          data_type: 'text',
          exercise_type: 'summary',
          difficulty: 'easy',
          llm_id: 'llm-1',
          updated_at: '',
          created_at: '',
          schema: { user: 'user prompt', system: 'system prompt' },
          llm: {
            id: 'llm-1',
            vendor: 'openai',
            model: 'gpt-4o',
            max_tokens: 8192,
            created_at: '',
            updated_at: '',
            meta: {},
            is_active: true,
          },
        },
        created_at: '',
        updated_at: '',
      },
      source_combo_min: 1,
      source_combo_max: 2,
      allow_repeat_when_exhausted: false,
      created_at: '',
      updated_at: '',
    }
    const error = new OperationError(
      resolveOutputConfigByProfileId.name,
      ERROR_CODES.UNUSED_SOURCE_PATTERN_NOT_FOUND,
      '未使用のソースパターンを取得できませんでした',
      `profileId: ${profileId}, sourceCombMin: ${baseConfigData.source_combo_min}, sourceCombMax: ${baseConfigData.source_combo_max}, allowRepeatWhenExhausted: ${baseConfigData.allow_repeat_when_exhausted}`,
    )

    const fakeDeps = {
      resolveOutputConfigByProfileId: () =>
        Promise.resolve({
          success: true as const,
          data: baseConfigData,
        }),
      resolveSourcesByProfileId: () =>
        Promise.resolve({
          success: false as const,
          error,
        }),
      generateExerciseByLlmFromSourcesParams: (_: any): any => {},
      saveGeneratedExercise: (_: any): any => {},
      deletePattern: (_: any): any => {},
    }

    const jobProcess = createJobProcess(fakeDeps)
    const res = await jobProcess(supabase, {
      job_run_mode: 'test',
      profile_id: profileId,
    })

    assertEquals(res.success, true)
    if (res.success) {
      assertEquals(res.data.status, 'warn')
      assertEquals(res.data.metrics.profileId, profileId)
      assertEquals(res.data.metrics.errors, [
        {
          functionName: jobProcess.name,
          code: ERROR_CODES.UNUSED_SOURCE_PATTERN_NOT_FOUND,
          category: ERROR_CATEGORIES.BUSINESS_LOGIC_ERROR,
        },
      ])
    }
  })

  await t.step('異常系: resolveOutputConfigByProfileId が失敗', async () => {
    const fakeError = new UnexpectedError('resolveOutputConfigByProfileId', 'failed')
    const fakeDeps = {
      resolveOutputConfigByProfileId: () => ({
        success: false,
        error: fakeError,
      }),
    }

    const jobProcess = createJobProcess(fakeDeps as any)
    const res = await jobProcess(supabase, {
      job_run_mode: 'test',
      profile_id: profileId,
    })

    assertEquals(res.success, false)
    assertEquals(res.error, fakeError)
    assertInstanceOf(res.error, UnexpectedError)
  })

  await t.step('異常系: configData が null の場合は UnexpectedError', async () => {
    const fakeDeps = {
      resolveOutputConfigByProfileId: () => ({
        success: true,
        data: null,
      }),
    }

    const jobProcess = createJobProcess(fakeDeps as any)
    const res = await jobProcess(supabase, {
      job_run_mode: 'test',
      profile_id: profileId,
    })

    assertEquals(res.success, false)
    assertInstanceOf(res.error, UnexpectedError)
  })

  await t.step(
    '異常系: resolveSourcesByProfileId が別エラーで失敗 → そのまま返す',
    async () => {
      const baseConfigData: GenerateExerciseOutputConfigByProfileIdResponse = {
        id: 'id',
        name: 'name',
        description: 'description',
        is_active: true,
        output_config_id: 'output_config_id',
        output_config: {
          id: 'id',
          name: 'name',
          description: 'description',
          exercise_type: 'summary',
          data_type: 'text',
          difficulty: 'easy',
          llm_id: 'llm-1',
          schema: {
            data_type: 'text',
            exercise_type: 'summary',
            difficulty: 'easy',
            llm_id: 'llm-1',
            updated_at: '',
            created_at: '',
            schema: { user: 'user prompt', system: 'system prompt' },
            llm: {
              id: 'llm-1',
              vendor: 'openai',
              model: 'gpt-4o',
              max_tokens: 8192,
              created_at: '',
              updated_at: '',
              meta: {},
              is_active: true,
            },
          },
          created_at: '',
          updated_at: '',
        },
        source_combo_min: 1,
        source_combo_max: 2,
        allow_repeat_when_exhausted: false,
        created_at: '',
        updated_at: '',
      }
      const sourceErr = new UnexpectedError('resolveSources', 'boom')
      const fakeDeps = {
        resolveOutputConfigByProfileId: () => ({
          success: true,
          data: baseConfigData,
        }),
        resolveSourcesByProfileId: () => ({
          success: false,
          error: sourceErr,
        }),
      }

      const jobProcess = createJobProcess(fakeDeps as any)
      const res = await jobProcess(supabase, {
        job_run_mode: 'test',
        profile_id: profileId,
      })

      assertEquals(res.success, false)
      assertEquals(res.error, sourceErr)
    },
  )

  await t.step(
    '異常系: generateExerciseByLlmFromSourcesParams が失敗 → deletePattern が呼ばれる',
    async () => {
      const baseConfigData: GenerateExerciseOutputConfigByProfileIdResponse = {
        id: 'id',
        name: 'name',
        description: 'description',
        is_active: true,
        output_config_id: 'output_config_id',
        output_config: {
          id: 'id',
          name: 'name',
          description: 'description',
          exercise_type: 'summary',
          data_type: 'text',
          difficulty: 'easy',
          llm_id: 'llm-1',
          schema: {
            data_type: 'text',
            exercise_type: 'summary',
            difficulty: 'easy',
            llm_id: 'llm-1',
            updated_at: '',
            created_at: '',
            schema: { user: 'user prompt', system: 'system prompt' },
            llm: {
              id: 'llm-1',
              vendor: 'openai',
              model: 'gpt-4o',
              max_tokens: 8192,
              created_at: '',
              updated_at: '',
              meta: {},
              is_active: true,
            },
          },
          created_at: '',
          updated_at: '',
        },
        source_combo_min: 1,
        source_combo_max: 2,
        allow_repeat_when_exhausted: false,
        created_at: '',
        updated_at: '',
      }
      const resolvedSources: ResolveSourcesResponse = {
        patternId: 'patterId',
        sources: [
          {
            id: 'source_id',
            title: 'title',
            description: 'description',
            aggregate_type: 'theme',
            theme_id: 'theme_id',
            is_active: true,
            created_at: '',
            updated_at: '',
          },
        ],
      }
      const genErr = new UnexpectedError('generate', 'fail-gen')
      const deletePatternSpy = spy((_sb: any, _pid: string) =>
        Promise.resolve({ success: true as const }),
      )

      const fakeDeps = {
        resolveOutputConfigByProfileId: () =>
          Promise.resolve({
            success: true as const,
            data: baseConfigData,
          }),
        resolveSourcesByProfileId: () =>
          Promise.resolve({
            success: true as const,
            data: resolvedSources,
          }),
        generateExerciseByLlmFromSourcesParams: () =>
          Promise.resolve({
            success: false,
            error: genErr,
          }),
        saveGeneratedExercise: () => Promise.resolve({ success: true, data: {} }),
        deletePattern: deletePatternSpy,
      }

      const jobProcess = createJobProcess(fakeDeps as any)
      const res = await jobProcess(supabase, {
        job_run_mode: 'test',
        profile_id: profileId,
      })

      assertEquals(res.success, false)
      assertInstanceOf(res.error, UnexpectedError)
      assertSpyCalls(deletePatternSpy, 1)
    },
  )

  await t.step(
    '異常系: generateExerciseByLlmFromSourcesParams が失敗 → deletePattern が呼ばれる',
    async () => {
      const baseConfigData: GenerateExerciseOutputConfigByProfileIdResponse = {
        id: 'id',
        name: 'name',
        description: 'description',
        is_active: true,
        output_config_id: 'output_config_id',
        output_config: {
          id: 'id',
          name: 'name',
          description: 'description',
          exercise_type: 'summary',
          data_type: 'text',
          difficulty: 'easy',
          llm_id: 'llm-1',
          schema: {
            data_type: 'text',
            exercise_type: 'summary',
            difficulty: 'easy',
            llm_id: 'llm-1',
            updated_at: '',
            created_at: '',
            schema: { user: 'user prompt', system: 'system prompt' },
            llm: {
              id: 'llm-1',
              vendor: 'openai',
              model: 'gpt-4o',
              max_tokens: 8192,
              created_at: '',
              updated_at: '',
              meta: {},
              is_active: true,
            },
          },
          created_at: '',
          updated_at: '',
        },
        source_combo_min: 1,
        source_combo_max: 2,
        allow_repeat_when_exhausted: false,
        created_at: '',
        updated_at: '',
      }
      const resolvedSources: ResolveSourcesResponse = {
        patternId: 'patterId',
        sources: [
          {
            id: 'source_id',
            title: 'title',
            description: 'description',
            aggregate_type: 'theme',
            theme_id: 'theme_id',
            is_active: true,
            created_at: '',
            updated_at: '',
          },
        ],
      }
      const generatedExercise: GenerateExerciseByLlmFromSourcesResponse = {
        title: 't',
        description: 'd',
        body: 'b',
      }
      const deletePatternSpy = spy((_sb: any, _pid: string) =>
        Promise.resolve({ success: true as const }),
      )
      const saveError = new UnexpectedError('save', 'fail-save')

      const fakeDeps = {
        resolveOutputConfigByProfileId: () =>
          Promise.resolve({
            success: true as const,
            data: baseConfigData,
          }),
        resolveSourcesByProfileId: () =>
          Promise.resolve({
            success: true as const,
            data: resolvedSources,
          }),
        generateExerciseByLlmFromSourcesParams: () =>
          Promise.resolve({
            success: false,
            error: generatedExercise,
          }),
        saveGeneratedExercise: () =>
          Promise.resolve({ success: false, error: saveError }),
        deletePattern: deletePatternSpy,
      }

      const jobProcess = createJobProcess(fakeDeps as any)
      const res = await jobProcess(supabase, {
        job_run_mode: 'test',
        profile_id: profileId,
      })

      assertEquals(res.success, false)
      assertInstanceOf(res.error, UnexpectedError)
      assertSpyCalls(deletePatternSpy, 1)
    },
  )

  await t.step('異常系: 想定外の題材種別 → UnexpectedError', async () => {
    const baseConfigData: GenerateExerciseOutputConfigByProfileIdResponse = {
      id: 'id',
      name: 'name',
      description: 'description',
      is_active: true,
      output_config_id: 'output_config_id',
      output_config: {
        id: 'id',
        name: 'name',
        description: 'description',
        exercise_type: 'summary',
        data_type: 'text',
        difficulty: 'easy',
        llm_id: 'llm-1',
        schema: {
          data_type: 'text',
          exercise_type: 'summary',
          difficulty: 'easy',
          llm_id: 'llm-1',
          updated_at: '',
          created_at: '',
          schema: { user: 'user prompt', system: 'system prompt' },
          llm: {
            id: 'llm-1',
            vendor: 'openai',
            model: 'gpt-4o',
            max_tokens: 8192,
            created_at: '',
            updated_at: '',
            meta: {},
            is_active: true,
          },
        },
        created_at: '',
        updated_at: '',
      },
      source_combo_min: 1,
      source_combo_max: 2,
      allow_repeat_when_exhausted: false,
      created_at: '',
      updated_at: '',
    }
    const fakeDeps = {
      resolveOutputConfigByProfileId: () => ({
        success: true,
        data: {
          ...baseConfigData,
          output_config: {
            ...baseConfigData.output_config,
            exercise_type: 'unknown',
          },
        },
      }),
    }

    const jobProcess = createJobProcess(fakeDeps as any)
    const res = await jobProcess(supabase, {
      job_run_mode: 'test',
      profile_id: profileId,
    })

    assertEquals(res.success, false)
    assertInstanceOf(res.error, UnexpectedError)
  })
})
