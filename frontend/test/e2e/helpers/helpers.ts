// tests/e2e/_helpers.ts
import { APIRequestContext, expect, Page } from '@playwright/test'

export async function signupViaLink(
  api: APIRequestContext,
  baseURL: string,
  secret: string,
  email: string,
  password: string,
) {
  const resp = await api.post(`${baseURL}/api/e2e/auth/generate-link`, {
    headers: { 'x-e2e-secret': secret, 'content-type': 'application/json' },
    data: JSON.stringify({ type: 'signup', email, password }),
  })
  expect(resp.ok()).toBeTruthy()
  const json = await resp.json()
  const actionLink = json.action_link as string

  return actionLink
}

export async function magicLink(
  api: APIRequestContext,
  baseURL: string,
  secret: string,
  email: string,
  password: string,
) {
  const resp = await api.post(`${baseURL}/api/e2e/auth/generate-link`, {
    headers: { 'x-e2e-secret': secret, 'content-type': 'application/json' },
    data: JSON.stringify({ type: 'magiclink', email, password }),
  })
  expect(resp.ok()).toBeTruthy()
  const json = await resp.json()
  const actionLink = json.action_link as string

  return actionLink
}

export async function expectAuthCookieExists(page: Page) {
  const cookies = await page.context().cookies()
  expect(cookies.some((c) => /sb-[a-z0-9]+-auth-token/.test(c.name))).toBe(true)
}

export async function expectAuthCookieNotExists(page: Page) {
  const cookies = await page.context().cookies()
  expect(cookies.some((c) => /sb-[a-z0-9]+-auth-token/.test(c.name))).toBe(false)
}
