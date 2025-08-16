import { test, expect } from '@playwright/test'

import { S } from './const/selector'
import { PROTECTED_PATHS, PUBLIC_PATHS } from '@/lib/constants/routes'
import { EMAIL, PASSWORD, SECRET } from './const/auth'

test.describe('プロフィール画面遷移→プロフィール編集', () => {
  test('正常系', async ({ page, baseURL }) => {
    test.skip(!SECRET, 'E2E_SECRET is required')

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

    // データ更新がされるまで少し待機
    await page.waitForTimeout(1000)
    await page.reload()
    await expect(displayNameInput).toContainText('test display name')
    await expect(bioInput).toContainText('test bio')
  })
})

test.describe('プロフィール画面遷移→アカウント設定', () => {
  // メールを受信して、添付URLをクリックするといった外部サービスが絡むフローはE2Eで実施するとかなり口数がかかるため、手動でチェックを実施。ここでは、あくまで画面遷移までとする
  test('メールアドレス変更:正常系', async ({ page, baseURL }) => {
    test.skip(!SECRET, 'E2E_SECRET is required')

    // --- ダッシュボード画面に遷移 ---
    await page.goto(`${baseURL}${PROTECTED_PATHS.DASHBOARD}`)
    await expect(page).toHaveURL(new RegExp(`^${baseURL}${PROTECTED_PATHS.DASHBOARD}$`))

    // --- プロフィール画面に移動してメールアドレス更新 ---
    await page.getByTestId(S.userMenuIcon).click()
    await page.getByTestId(S.userMenuProfile).click()
    await expect(page).toHaveURL(new RegExp(`^${baseURL}${PROTECTED_PATHS.PROFILE}$`))
    await page.getByTestId(S.profileSideMenuAccount).click()
    await page.getByTestId(S.profileAccountEditEmailBtn).click()
    await expect(page).toHaveURL(
      new RegExp(`^${baseURL}${PROTECTED_PATHS.EMAIL_CHANGE}$`),
    )
  })
  test('パスワード変更:正常系', async ({ page, baseURL }) => {
    test.skip(!SECRET, 'E2E_SECRET is required')

    // --- ダッシュボード画面に遷移 ---
    await page.goto(`${baseURL}${PROTECTED_PATHS.DASHBOARD}`)
    await expect(page).toHaveURL(new RegExp(`^${baseURL}${PROTECTED_PATHS.DASHBOARD}$`))

    // --- プロフィール画面に移動してパスワード更新 ---
    await page.getByTestId(S.userMenuIcon).click()
    await page.getByTestId(S.userMenuProfile).click()
    await expect(page).toHaveURL(new RegExp(`^${baseURL}${PROTECTED_PATHS.PROFILE}$`))
    await page.getByTestId(S.profileSideMenuAccount).click()
    await page.getByTestId(S.profileAccountEditPasswordBtn).click()
    await expect(page).toHaveURL(
      new RegExp(`^${baseURL}${PROTECTED_PATHS.PASSWORD_CHANGE}$`),
    )
    await page.getByTestId(S.passwordChangeCurrentPasswordInput).fill(PASSWORD)
    const newPassword = 'Passw0rd!'
    await page.getByTestId(S.passwordChangeNewPasswordInput).fill(newPassword)
    await page.getByTestId(S.passwordChangeNewConfirmPasswordInput).fill(newPassword)
    await page.getByTestId(S.updatePasswordBtn).click()
    await expect(page).toHaveURL(new RegExp(`^${baseURL}${PROTECTED_PATHS.PROFILE}$`))

    // --- 更新したパスワードでログイン ---
    await page.getByTestId(S.userMenuIcon).click()
    await page.getByTestId(S.userMenuSignout).click()
    await expect(page).toHaveURL(new RegExp(`^${baseURL}${PUBLIC_PATHS.HOME}$`))
    await page.getByTestId(S.headerSigninLink).click()
    await expect(page).toHaveURL(new RegExp(`^${baseURL}${PUBLIC_PATHS.SIGNIN}$`))
    await page.waitForLoadState('networkidle') // ハイドレーションを待つ
    await page.getByTestId(S.signinEmailInput).fill(EMAIL)
    await page.getByTestId(S.signinPasswordInput).fill(newPassword)
    await page.getByTestId(S.signinBtn).click()
    await expect(page).toHaveURL(new RegExp(`^${baseURL}${PROTECTED_PATHS.DASHBOARD}$`))
  })
})
