import { defineConfig, devices } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as dotenv from 'dotenv'

// ここで .env.e2e を読む（存在すれば）
const envFile = process.env.PLAYWRIGHT_ENV_FILE || '.env'
const envPath = path.resolve(process.cwd(), envFile)
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  console.warn(`[playwright] Env file not found: ${envPath}`)
}

const baseURL = process.env.E2E_BASE_URL
if (!baseURL) {
  // CIでURL未設定なら即落とす
  console.error('E2E_BASE_URL is required')
  process.exit(1)
}

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // vercel環境上でテストを実施する際は、ByPass認証必須
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': process.env.VERCEL_BYPASS_SECRET || '',
    },
  },
  projects: [
    // 1回だけログインして state を保存
    { name: 'setup', testMatch: /auth\.setup\.test\.ts/ },

    // 以降のテストは保存済み state を使用
    {
      name: 'profile',
      testMatch: /profile\.test\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/state.json',
      },
      dependencies: ['setup'],
    },
  ],
  globalTeardown: './test/e2e/global-teardown.ts',
})
