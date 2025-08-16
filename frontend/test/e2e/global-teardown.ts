import { request } from '@playwright/test'

async function globalTeardown() {
  const baseURL = process.env.E2E_BASE_URL!
  const e2eSecret = process.env.E2E_SECRET!

  const req = await request.newContext()
  const resp = await req.post(`${baseURL}/api/e2e/users/delete`, {
    headers: { 'x-e2e-secret': e2eSecret },
  })
  if (!resp.ok()) {
    console.error('Failed to delete test user:', await resp.text())
  }
  await req.dispose()
}
export default globalTeardown
