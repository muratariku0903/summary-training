// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference lib="deno.ns" />

import {
  assertEquals,
  assertInstanceOf,
} from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { stub } from 'https://deno.land/std@0.208.0/testing/mock.ts'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../../../functions/_shared/types/database.ts'
import { createJobProcess } from '../../../functions/generate_exersice_seeds/process.ts'
import { SeedGeneratorProfilesRow } from '../../_shared/types/seed_generator_profiles.ts'
import {
  DatabaseQueryError,
  InvalidRequestError,
  OperationError,
  UnexpectedError,
} from '../../_shared/error/error.ts'
import { generateSeedDataFromTheme } from '../../_shared/usecase/generate_seeds/generate_seeds.ts'
import { ERROR_CODES } from '../../_shared/error/code.ts'
import { saveSeed } from '../../_shared/repository/exercise_generator_seeds.ts'

Deno.test('generate_exercise_seeds バッチ処理テスト', async (t) => {
  // 依存モジュールを読み込み
  const depsModule = await import('../../../functions/generate_exersice_seeds/deps.ts')

  // 使い回すクライアントのダミー
  const mockSupabaseClient = {} as SupabaseClient<Database>

  // 正常系: SEEDが生成・保存されて成功になる
  await t.step('正常系: ai_theme プロファイルで生成/保存が成功', async () => {
    const mockProfile = {
      id: 'profile-1',
      profile_type: 'ai_theme',
      config: {},
      is_active: true,
    } as SeedGeneratorProfilesRow

    const getProfileStub = stub(depsModule.deps, 'getActiveProfileById', () =>
      Promise.resolve({
        success: true as const,
        data: mockProfile,
      }),
    )
    const safeParseStub = stub(
      depsModule.deps.generateSeedFromThemeConfigSchema,
      'safeParse',
      () =>
        ({
          success: true,
          data: mockProfile.config,
        }) as any,
    )
    const generateSeedStub = stub(depsModule.deps, 'generateSeedDataFromTheme', () =>
      Promise.resolve({
        success: true as const,
        data: {
          themeId: 'theme-1',
          llmId: 'llm-1',
          result: {
            locale: 'ja_JP',
            title: 'dummy title',
            summary: 'dummy summary',
            rawText: 'dummy raw text',
          },
        },
      }),
    )
    const saveSeedStub = stub(depsModule.deps, 'saveSeed', () =>
      Promise.resolve({
        success: true as const,
        data: { seed_id: 'seed-123' },
      }),
    )

    try {
      const jobProcess = createJobProcess()
      const { success, data } = await jobProcess(mockSupabaseClient, {
        job_run_mode: 'test',
        profile_id: 'profile-1',
      })

      assertEquals(success, true)
      if (success) {
        assertEquals(data.status, 'success')
        assertEquals(data.metrics?.db?.length, 1)
        assertEquals(data.metrics?.db?.[0]?.tableName, 'exercise_generator_seeds')
        assertEquals(data.metrics?.db?.[0]?.insert?.[0], 'seed-123')
      }
    } finally {
      getProfileStub.restore()
      safeParseStub.restore()
      generateSeedStub.restore()
      saveSeedStub.restore()
    }
  })

  // 異常系: プロファイル取得失敗
  await t.step('異常系: プロファイル取得に失敗した場合はエラーで終了', async () => {
    const databaseQueryError = new DatabaseQueryError(
      'getActiveProfileById',
      'SELECT',
      'seed_generator_profiles',
    )
    const getProfileStub = stub(depsModule.deps, 'getActiveProfileById', () =>
      Promise.resolve({
        success: false as const,
        error: databaseQueryError,
      }),
    )

    try {
      const jobProcess = createJobProcess()
      const { success, error } = await jobProcess(mockSupabaseClient, {
        job_run_mode: 'test',
        profile_id: 'profile-err',
      })

      assertEquals(success, false)
      assertEquals(error, databaseQueryError)
    } finally {
      getProfileStub.restore()
    }
  })

  // 異常系: コンフィグのZodバリデーション失敗
  await t.step('異常系: config の解析に失敗した場合は InvalidRequestError', async () => {
    const mockProfile = {
      id: 'profile-2',
      profile_type: 'ai_theme',
      config: {},
      is_active: true,
    } as SeedGeneratorProfilesRow

    const getProfileStub = stub(depsModule.deps, 'getActiveProfileById', () =>
      Promise.resolve({
        success: true as const,
        data: mockProfile,
      }),
    )
    const safeParseStub = stub(
      depsModule.deps.generateSeedFromThemeConfigSchema,
      'safeParse',
      () =>
        ({
          success: false,
          error: { message: 'invalid config' },
        }) as any,
    )

    try {
      const jobProcess = createJobProcess()
      const { success, error } = await jobProcess(mockSupabaseClient, {
        job_run_mode: 'test',
        profile_id: 'profile-2',
      })

      assertEquals(success, false)
      assertInstanceOf(error, InvalidRequestError)
    } finally {
      getProfileStub.restore()
      safeParseStub.restore()
    }
  })

  // // 異常系: 生成ユースケース失敗
  await t.step('異常系: SEED生成で失敗した場合はエラーで終了', async () => {
    const mockProfile = {
      id: 'profile-3',
      profile_type: 'ai_theme',
      config: {},
      is_active: true,
    } as SeedGeneratorProfilesRow

    const getProfileStub = stub(depsModule.deps, 'getActiveProfileById', () =>
      Promise.resolve({
        success: true as const,
        data: mockProfile,
      }),
    )
    const safeParseStub = stub(
      depsModule.deps.generateSeedFromThemeConfigSchema,
      'safeParse',
      () =>
        ({
          success: true,
          data: mockProfile.config,
        }) as any,
    )
    const seedError = new OperationError(
      generateSeedDataFromTheme.name,
      ERROR_CODES.RECORD_NOT_FOUND,
      'LLM情報の取得に失敗しました',
      `LLM情報はSEED生成に必須です`,
    )
    const generateSeedStub = stub(depsModule.deps, 'generateSeedDataFromTheme', () =>
      Promise.resolve({
        success: false as const,
        error: seedError,
      }),
    )

    try {
      const jobProcess = createJobProcess()
      const { success, error } = await jobProcess(mockSupabaseClient, {
        job_run_mode: 'test',
        profile_id: 'profile-3',
      })

      assertEquals(success, false)
      assertEquals(error, seedError)
    } finally {
      getProfileStub.restore()
      safeParseStub.restore()
      generateSeedStub.restore()
    }
  })

  // // 異常系: 保存失敗
  await t.step('異常系: SEED保存で失敗した場合はエラーで終了', async () => {
    const mockProfile = {
      id: 'profile-4',
      profile_type: 'ai_theme',
      config: {},
      is_active: true,
    } as SeedGeneratorProfilesRow

    const getProfileStub = stub(depsModule.deps, 'getActiveProfileById', () =>
      Promise.resolve({
        success: true as const,
        data: mockProfile,
      }),
    )
    const safeParseStub = stub(
      depsModule.deps.generateSeedFromThemeConfigSchema,
      'safeParse',
      () =>
        ({
          success: true,
          data: mockProfile.config,
        }) as any,
    )
    const generateSeedStub = stub(depsModule.deps, 'generateSeedDataFromTheme', () =>
      Promise.resolve({
        success: true as const,
        data: {
          themeId: 'theme-1',
          llmId: 'llm-1',
          result: {
            locale: 'ja_JP',
            title: 'dummy title',
            summary: 'dummy summary',
            rawText: 'dummy raw text',
          },
        },
      }),
    )
    const saveError = new DatabaseQueryError(
      saveSeed.name,
      'INSERT',
      'exercise_generator_seeds',
    )
    const saveSeedStub = stub(depsModule.deps, 'saveSeed', () =>
      Promise.resolve({
        success: false as const,
        error: saveError,
      }),
    )

    try {
      const jobProcess = createJobProcess()
      const { success, error } = await jobProcess(mockSupabaseClient, {
        job_run_mode: 'test',
        profile_id: 'profile-4',
      })

      assertEquals(success, false)
      assertEquals(error, saveError)
    } finally {
      getProfileStub.restore()
      safeParseStub.restore()
      generateSeedStub.restore()
      saveSeedStub.restore()
    }
  })

  // // 異常系: 想定外プロファイルタイプ
  await t.step('異常系: 想定外の profile_type は UnexpectedError', async () => {
    const mockProfile = {
      id: 'profile-5',
      profile_type: 'storage',
      config: {},
      is_active: true,
    } as SeedGeneratorProfilesRow

    const getProfileStub = stub(depsModule.deps, 'getActiveProfileById', () =>
      Promise.resolve({
        success: true as const,
        data: mockProfile,
      }),
    )

    try {
      const jobProcess = createJobProcess()
      const { success, error } = await jobProcess(mockSupabaseClient, {
        job_run_mode: 'test',
        profile_id: 'profile-5',
      })

      assertEquals(success, false)
      assertInstanceOf(error, UnexpectedError)
    } finally {
      getProfileStub.restore()
    }
  })
})
