// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference lib="deno.ns" />

import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { stub } from 'https://deno.land/std@0.208.0/testing/mock.ts'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SeedGeneratorCategoriesRow } from '../../../functions/_shared/types/seed_generator_categories.ts'
import { GenerateThemeResponse } from '../../../functions/_shared/usecase/generate_themes/generate_themes.ts'
import { Database } from '../../../functions/_shared/types/database.ts'

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

  await t.step('正常系: テーマが正常に生成・保存される', async () => {
    // モック設定
    const mockSupabaseClient = {} as SupabaseClient<Database>
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
      const { jobProcess } = await import(
        '../../../functions/generate_seed_themes/process.ts'
      )
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
      // クリーンアップ
      pickRandomCategoryStub?.restore()
      generateThemeStub?.restore()
      transactionStub?.restore()
    }
  })

  // await t.step('異常系: カテゴリー取得に失敗した場合', async () => {
  //   // Arrange
  //   let pickRandomCategoryStub: Stub

  //   try {
  //     pickRandomCategoryStub = stub(
  //       await import('../_shared/repository/seed_generator_categories.ts'),
  //       'pickRandomCategory',
  //       () =>
  //         Promise.resolve({
  //           success: false,
  //           error: new Error('カテゴリー取得エラー'),
  //         }),
  //     )

  //     // Act
  //     const response = await fetch(
  //       'http://localhost:54321/functions/v1/generate_seed_themes',
  //       {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           job_run_mode: 'manual',
  //           generate_theme_count: 1,
  //         }),
  //       },
  //     )

  //     // Assert
  //     const result = await response.json()
  //     assertEquals(response.status, 500)
  //     assertEquals(result.ok, false)
  //     assertExists(result.error)
  //   } finally {
  //     pickRandomCategoryStub?.restore()
  //   }
  // })

  // await t.step('異常系: テーマ生成でMAX_RETRY_ERRORが発生した場合', async () => {
  //   // Arrange
  //   let pickRandomCategoryStub: Stub
  //   let generateThemeStub: Stub

  //   try {
  //     pickRandomCategoryStub = stub(
  //       await import('../_shared/repository/seed_generator_categories.ts'),
  //       'pickRandomCategory',
  //       () =>
  //         Promise.resolve({
  //           success: true,
  //           data: mockCategory,
  //         }),
  //     )

  //     generateThemeStub = stub(
  //       await import('../_shared/usecase/generate_themes/generate_themes.ts'),
  //       'generateTheme',
  //       () =>
  //         Promise.resolve({
  //           success: false,
  //           error: {
  //             code: ERROR_CODES.MAX_RETRY_ERROR,
  //             category: ERROR_CATEGORIES.SYSTEM_ERROR,
  //             functionName: 'generateTheme',
  //             summary: 'リトライ上限エラー',
  //             detail: '3回リトライしましたが失敗しました',
  //           },
  //         }),
  //     )

  //     // Act
  //     const response = await fetch(
  //       'http://localhost:54321/functions/v1/generate_seed_themes',
  //       {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           job_run_mode: 'manual',
  //           generate_theme_count: 1,
  //         }),
  //       },
  //     )

  //     // Assert
  //     const result = await response.json()
  //     assertEquals(response.status, 200)
  //     assertEquals(result.data.status, 'warn')
  //     assertEquals(result.data.metrics.errors.length, 1)
  //     assertEquals(result.data.metrics.errors[0].code, ERROR_CODES.MAX_RETRY_ERROR)
  //   } finally {
  //     pickRandomCategoryStub?.restore()
  //     generateThemeStub?.restore()
  //   }
  // })

  // await t.step('異常系: DrizzleErrorが発生した場合', async () => {
  //   // Arrange
  //   let pickRandomCategoryStub: Stub
  //   let generateThemeStub: Stub
  //   let transactionStub: Stub

  //   try {
  //     pickRandomCategoryStub = stub(
  //       await import('../_shared/repository/seed_generator_categories.ts'),
  //       'pickRandomCategory',
  //       () =>
  //         Promise.resolve({
  //           success: true,
  //           data: mockCategory,
  //         }),
  //     )

  //     generateThemeStub = stub(
  //       await import('../_shared/usecase/generate_themes/generate_themes.ts'),
  //       'generateTheme',
  //       () =>
  //         Promise.resolve({
  //           success: true,
  //           data: mockGeneratedTheme,
  //         }),
  //     )

  //     transactionStub = stub(drizzleDB, 'transaction', () => {
  //       const error = new Error('DB制約違反')
  //       error.name = 'DrizzleError'
  //       throw error
  //     })

  //     // Act
  //     const response = await fetch(
  //       'http://localhost:54321/functions/v1/generate_seed_themes',
  //       {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           job_run_mode: 'manual',
  //           generate_theme_count: 1,
  //         }),
  //       },
  //     )

  //     // Assert
  //     const result = await response.json()
  //     assertEquals(response.status, 200)
  //     assertEquals(result.data.status, 'warn')
  //     assertEquals(result.data.metrics.errors.length, 1)
  //     assertEquals(result.data.metrics.errors[0].code, ERROR_CODES.DATABASE_QUERY_ERROR)
  //   } finally {
  //     pickRandomCategoryStub?.restore()
  //     generateThemeStub?.restore()
  //     transactionStub?.restore()
  //   }
  // })

  // await t.step('認証: CRON_SECRETが不正な場合', async () => {
  //   // Act
  //   const response = await fetch(
  //     'http://localhost:54321/functions/v1/generate_seed_themes',
  //     {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'x-cron-secret': 'invalid-secret',
  //       },
  //       body: JSON.stringify({
  //         job_run_mode: 'manual',
  //         generate_theme_count: 1,
  //       }),
  //     },
  //   )

  //   // Assert
  //   assertEquals(response.status, 401)
  //   const result = await response.json()
  //   assertEquals(result.ok, false)
  // })

  // await t.step('バリデーション: 不正なリクエストボディの場合', async () => {
  //   // Act
  //   const response = await fetch(
  //     'http://localhost:54321/functions/v1/generate_seed_themes',
  //     {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         invalid_field: 'invalid_value',
  //       }),
  //     },
  //   )

  //   // Assert
  //   assertEquals(response.status, 400)
  //   const result = await response.json()
  //   assertEquals(result.ok, false)
  // })

  // await t.step('複数テーマ生成: generate_theme_countが複数の場合', async () => {
  //   // Arrange
  //   let pickRandomCategoryStub: Stub
  //   let generateThemeStub: Stub
  //   let transactionStub: Stub

  //   try {
  //     pickRandomCategoryStub = stub(
  //       await import('../_shared/repository/seed_generator_categories.ts'),
  //       'pickRandomCategory',
  //       () =>
  //         Promise.resolve({
  //           success: true,
  //           data: mockCategory,
  //         }),
  //     )

  //     generateThemeStub = stub(
  //       await import('../_shared/usecase/generate_themes/generate_themes.ts'),
  //       'generateTheme',
  //       () =>
  //         Promise.resolve({
  //           success: true,
  //           data: mockGeneratedTheme,
  //         }),
  //     )

  //     transactionStub = stub(drizzleDB, 'transaction', () =>
  //       Promise.resolve({
  //         insertedTheme: mockInsertedTheme,
  //         insertedThemeCategories: mockInsertedThemeCategories,
  //       }),
  //     )

  //     // Act
  //     const response = await fetch(
  //       'http://localhost:54321/functions/v1/generate_seed_themes',
  //       {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           job_run_mode: 'manual',
  //           generate_theme_count: 3,
  //         }),
  //       },
  //     )

  //     // Assert
  //     const result = await response.json()
  //     assertEquals(response.status, 200)
  //     assertEquals(result.data.metrics.db.length, 6) // 3テーマ × 2テーブル
  //     assertEquals(generateThemeStub.calls.length, 3)
  //   } finally {
  //     pickRandomCategoryStub?.restore()
  //     generateThemeStub?.restore()
  //     transactionStub?.restore()
  //   }
  // })
})
