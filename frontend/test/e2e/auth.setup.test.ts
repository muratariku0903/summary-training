import { test, expect, request } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import {
  expectAuthCookieExists,
  expectAuthCookieNotExists,
  magicLink,
  signupViaLink,
} from './helpers/helpers'
import { S } from './const/selector'
import { PROTECTED_PATHS, PUBLIC_PATHS } from '@/lib/constants/routes'
import { EMAIL, PASSWORD, SECRET } from './const/auth'

test.describe('メール+パスワード｜サインアップ→ログアウト→再ログイン', () => {
  test('正常系', async ({ page, context, baseURL }) => {
    test.skip(!SECRET, 'E2E_SECRET is required')
    const api = await request.newContext()

    // --- サインアップ → 自動ログイン（/dashboardへ） ---
    const actionLink = await signupViaLink(api, baseURL!, SECRET!, EMAIL, PASSWORD)
    await page.goto(actionLink)
    await expect(page).toHaveURL(new RegExp(`^${baseURL}${PROTECTED_PATHS.DASHBOARD}$`))
    await expectAuthCookieExists(page)

    // --- ログアウト → 未ログインUI/URLの確認 ---
    await page.getByTestId(S.userMenuIcon).click()
    await page.getByTestId(S.userMenuSignout).click()
    await expect(page).toHaveURL(new RegExp(`^${baseURL}${PUBLIC_PATHS.HOME}$`))
    await expectAuthCookieNotExists(page)

    // 未ログインで保護ページにアクセス → /loginへリダイレクト
    await page.goto(`${baseURL}${PROTECTED_PATHS.DASHBOARD}`)
    await expect(page).toHaveURL(new RegExp(`^${baseURL}${PUBLIC_PATHS.SIGNIN}$`))

    // --- マジックリンクで再ログイン（/dashboardへ） ---
    const magic = await magicLink(api, baseURL!, SECRET!, EMAIL, PASSWORD)
    await page.goto(magic)
    await expect(page).toHaveURL(new RegExp(`^${baseURL}${PROTECTED_PATHS.DASHBOARD}$`))
    await expectAuthCookieExists(page)

    // storageState 保存
    // ブラウザ内のセッション情報そのものをPlaywrightランナーにエクスポートしているイメージ
    // 後続のテストでこのセッション情報を使い回す
    const authDir = path.join('playwright', '.auth')
    fs.mkdirSync(authDir, { recursive: true })
    await context.storageState({ path: path.join(authDir, 'state.json') })
  })
})
