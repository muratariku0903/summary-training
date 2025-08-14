// tests/e2e/auth.setup.ts
import { test, expect, request } from '@playwright/test'

import {
  expectAuthCookieExists,
  expectAuthCookieNotExists,
  magicLink,
  signupViaLink,
} from './helpers/helpers'
import { S } from './const/selector'
import { PROTECTED_PATHS, PUBLIC_PATHS } from '@/lib/constants/routes'

const SECRET = process.env.E2E_SECRET

test.describe('プロフィール画面遷移→プロフィール編集', () => {
  test('正常系', async ({ page, context, baseURL }) => {
    test.skip(!SECRET, 'E2E_SECRET is required')
    const api = await request.newContext()

    // --- ダッシュボード画面に遷移 ---
    await page.goto(`${baseURL}${PROTECTED_PATHS.DASHBOARD}`)
    await expect(page).toHaveURL(new RegExp(`^${baseURL}${PROTECTED_PATHS.DASHBOARD}$`))

    // --- プロフィール画面に移動してプロフィール更新 ---
    await page.getByTestId(S.userMenuIcon).click()
    await page.getByTestId(S.userMenuProfile).click()
    await expect(page).toHaveURL(new RegExp(`^${baseURL}${PROTECTED_PATHS.PROFILE}$`))

    await page.getByTestId(S.profileSideMenuBasicInfo).click()
    await page.getByTestId(S.profileBasicInfoEditBtn).click()
    const displayNameInput = page.getByTestId(S.profileBasicInfoDisplayNameInput)
    const bioInput = page.getByTestId(S.profileBasicInfoBioInput)
    await displayNameInput.fill('test display name')
    await bioInput.fill('test bio')
    await page.getByTestId(S.profileBasicInfoSaveBtn).click()

    await page.reload()
    await expect(displayNameInput).toContainText('test display name')
    await expect(bioInput).toContainText('test bio')
  })
})
