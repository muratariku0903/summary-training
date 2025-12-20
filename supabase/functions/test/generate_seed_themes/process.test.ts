// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference lib="deno.ns" />

import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { stub } from 'https://deno.land/std@0.208.0/testing/mock.ts'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SeedGeneratorCategoriesRow } from '../../../functions/_shared/types/seed_generator_categories.ts'
import { GenerateThemeResponse } from '../../../functions/_shared/usecase/generate_themes/generate_themes.ts'
import { Database } from '../../_shared/types/db_schema.ts'
import {
  DatabaseQueryError,
  OperationError,
  UnexpectedError,
} from '../../../functions/_shared/error/error.ts'
import { createJobProcess } from '../../../functions/generate_seed_themes/process.ts'
import { ERROR_CODES } from '../../../functions/_shared/error/code.ts'
import { DrizzleError } from 'drizzle-orm/errors'

// テスト用のモックデータ
const mockCategory: SeedGeneratorCategoriesRow = {
  id: 'category-123',
  name: 'テストカテゴリー',
  description: 'テスト用のカテゴリー',
  parent_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockGeneratedTheme: GenerateThemeResponse = {
  themeTitle: 'テストテーマ',
  themeDescription: 'テスト用のテーマ説明',
  canonicalKey: 'test-theme-key',
}

const mockInsertedTheme = {
  id: 'theme-123',
}

const mockInsertedThemeCategories = {
  theme_id: 'theme-123',
  category_id: 'category-123',
}

Deno.test('generate_seed_themes バッチ処理テスト', async (t) => {
  const depsModule = await import('../../../functions/generate_seed_themes/deps.ts')
  const mockSupabaseClient = {} as SupabaseClient<Database>

  await t.step('正常系: テーマが正常に生成・保存される', async () => {
    const pickRandomCategoryStub = stub(depsModule.deps, 'pickRandomCategory', () =>
      Promise.resolve({
        success: true as const,
        data: mockCategory,
      }),
    )
    const generateThemeStub = stub(depsModule.deps, 'generateTheme', () =>
      Promise.resolve({
        success: true as const,
        data: mockGeneratedTheme,
      }),
    )
    const transactionStub = stub(
      depsModule.deps,
      'getDrizzleDBClient',
      () =>
        ({
          transaction: () =>
            Promise.resolve({
              insertedTheme: mockInsertedTheme,
              insertedThemeCategories: mockInsertedThemeCategories,
            }),
        }) as any,
    )

    try {
      // stub 後に対象を import（参照がモックに差し替わった状態で取り込まれる）
      const jobProcess = createJobProcess()
      const { success, data } = await jobProcess(mockSupabaseClient, {
        job_run_mode: 'test',
      })

      assertEquals(success, true)
      if (success) {
        assertEquals(data.status, 'success')
        assertEquals(data.metrics?.db?.length, 2)
        assertEquals(data.metrics?.errors?.length, 0)
      }
    } finally {
      pickRandomCategoryStub?.restore()
      generateThemeStub?.restore()
      transactionStub?.restore()
    }
  })

  await t.step(
    '正常系: 実行回数2が指定され、1回目は正常、2回目にMAX_RETRY_ERRORが発生した場合',
    async () => {
      const maxRetryError = new OperationError(
        'jobProcess',
        ERROR_CODES.MAX_RETRY_ERROR,
        'test summary',
        'test detail',
      )
      const pickRandomCategoryStub = stub(depsModule.deps, 'pickRandomCategory', () =>
        Promise.resolve({
          success: true as const,
          data: mockCategory,
        }),
      )
      let genCall = 0
      const generateThemeStub = stub(depsModule.deps, 'generateTheme', () => {
        genCall++
        if (genCall === 1) {
          return Promise.resolve({
            success: true as const,
            data: mockGeneratedTheme,
          })
        }
        return Promise.resolve({
          success: false as const,
          error: maxRetryError,
        })
      })
      const transactionStub = stub(
        depsModule.deps,
        'getDrizzleDBClient',
        () =>
          ({
            transaction: () =>
              Promise.resolve({
                insertedTheme: mockInsertedTheme,
                insertedThemeCategories: mockInsertedThemeCategories,
              }),
          }) as any,
      )

      try {
        const jobProcess = createJobProcess()
        const { success, data } = await jobProcess(mockSupabaseClient, {
          job_run_mode: 'test',
          generate_theme_count: 2,
        })

        assertEquals(success, true)
        if (success) {
          assertEquals(data.status, 'warn')
          assertEquals(data.metrics?.db?.length, 2)
          assertEquals(data.metrics?.errors?.length, 1)
        }
      } finally {
        pickRandomCategoryStub?.restore()
        generateThemeStub?.restore()
        transactionStub?.restore()
      }
    },
  )

  await t.step('異常系: カテゴリー取得に失敗した場合', async () => {
    const databaseQueryError = new DatabaseQueryError(
      'jobProcess',
      'SELECT',
      'seed_generator_categories',
    )
    const pickRandomCategoryStub = stub(depsModule.deps, 'pickRandomCategory', () =>
      Promise.resolve({
        success: false as const,
        error: databaseQueryError,
      }),
    )

    try {
      const jobProcess = createJobProcess()
      const { success, error } = await jobProcess(mockSupabaseClient, {
        job_run_mode: 'test',
      })

      assertEquals(success, false)
      assertEquals(error, databaseQueryError)
    } finally {
      pickRandomCategoryStub?.restore()
    }
  })

  await t.step('異常系: テーマ生成でMAX_RETRY_ERRORが発生した場合', async () => {
    const maxRetryError = new OperationError(
      'jobProcess',
      ERROR_CODES.MAX_RETRY_ERROR,
      'test summary',
      'test detail',
    )
    const pickRandomCategoryStub = stub(depsModule.deps, 'pickRandomCategory', () =>
      Promise.resolve({
        success: true as const,
        data: mockCategory,
      }),
    )
    const generateThemeStub = stub(depsModule.deps, 'generateTheme', () =>
      Promise.resolve({
        success: false as const,
        error: maxRetryError,
      }),
    )

    try {
      const jobProcess = createJobProcess()
      const { success, data } = await jobProcess(mockSupabaseClient, {
        job_run_mode: 'test',
      })

      assertEquals(success, true)
      if (success) {
        assertEquals(data.status, 'warn')
        assertEquals(data.metrics?.errors?.length, 1)
      }
    } finally {
      pickRandomCategoryStub?.restore()
      generateThemeStub?.restore()
    }
  })

  await t.step(
    '異常系: テーマ生成でMAX_RETRY_ERROR以外のエラーが発生した場合',
    async () => {
      const databaseQueryError = new DatabaseQueryError(
        'jobProcess',
        'SELECT',
        'seed_generator_categories',
      )
      const pickRandomCategoryStub = stub(depsModule.deps, 'pickRandomCategory', () =>
        Promise.resolve({
          success: true as const,
          data: mockCategory,
        }),
      )
      const generateThemeStub = stub(depsModule.deps, 'generateTheme', () =>
        Promise.resolve({
          success: false as const,
          error: databaseQueryError,
        }),
      )

      try {
        const jobProcess = createJobProcess()
        const { success, error } = await jobProcess(mockSupabaseClient, {
          job_run_mode: 'test',
        })

        assertEquals(success, false)
        assertEquals(error, databaseQueryError)
      } finally {
        pickRandomCategoryStub?.restore()
        generateThemeStub?.restore()
      }
    },
  )

  await t.step('異常系: DB保存でDrizzleErrorが発生した場合', async () => {
    const drizzleError = new DrizzleError({ message: 'drizzleError' })
    const pickRandomCategoryStub = stub(depsModule.deps, 'pickRandomCategory', () =>
      Promise.resolve({
        success: true as const,
        data: mockCategory,
      }),
    )
    const generateThemeStub = stub(depsModule.deps, 'generateTheme', () =>
      Promise.resolve({
        success: true as const,
        data: mockGeneratedTheme,
      }),
    )
    const transactionStub = stub(
      depsModule.deps,
      'getDrizzleDBClient',
      () =>
        ({
          transaction: () => {
            throw drizzleError
          },
        }) as any,
    )

    try {
      const jobProcess = createJobProcess()
      const { success, data } = await jobProcess(mockSupabaseClient, {
        job_run_mode: 'test',
      })

      assertEquals(success, true)
      if (success) {
        assertEquals(data.status, 'warn')
        assertEquals(data.metrics?.errors?.length, 1)
      }
    } finally {
      pickRandomCategoryStub?.restore()
      generateThemeStub?.restore()
      transactionStub?.restore()
    }
  })

  await t.step('異常系: DB保存でDrizzleError以外のエラーが発生した場合', async () => {
    const otherError = new Error('otherError')
    const pickRandomCategoryStub = stub(depsModule.deps, 'pickRandomCategory', () =>
      Promise.resolve({
        success: true as const,
        data: mockCategory,
      }),
    )
    const generateThemeStub = stub(depsModule.deps, 'generateTheme', () =>
      Promise.resolve({
        success: true as const,
        data: mockGeneratedTheme,
      }),
    )
    const transactionStub = stub(
      depsModule.deps,
      'getDrizzleDBClient',
      () =>
        ({
          transaction: () => {
            throw otherError
          },
        }) as any,
    )

    try {
      const jobProcess = createJobProcess()
      const { success, error } = await jobProcess(mockSupabaseClient, {
        job_run_mode: 'test',
      })

      assertEquals(success, false)
      assertEquals(error, new UnexpectedError(jobProcess.name, otherError))
    } finally {
      pickRandomCategoryStub?.restore()
      generateThemeStub?.restore()
      transactionStub?.restore()
    }
  })
})
