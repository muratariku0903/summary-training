/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, beforeEach, expect, vi } from 'vitest'
import { testApiHandler } from 'next-test-api-route-handler'
import * as handler from '@/app/api/auth/password/verify/route'
import { getAccessTokenFromHeader } from '@/lib/api/utils'
import { adminClient } from '@/lib/supabase/client/adminClient'
import { AuthError, User } from '@supabase/supabase-js'
import { checkValidSessionLevel } from '@/lib/supabase/auth/server/server'

vi.mock('@/lib/api/wrapper', () => ({
  withLogger: vi.fn((handler) => handler),
  withAuth: vi.fn((handler) => {
    return async (request: any, context: any) => {
      // getAccessTokenFromHeaderの結果を使って認証をシミュレート
      const { getAccessTokenFromHeader } = await import('@/lib/api/utils')
      const { adminClient } = await import('@/lib/supabase/client/adminClient')

      const accessToken = getAccessTokenFromHeader(request)
      if (!accessToken) {
        return new Response(
          JSON.stringify({
            error: { code: 'UNAUTHORIZED', message: 'Authorization header required' },
          }),
          { status: 401, headers: { 'content-type': 'application/json' } },
        )
      }

      const {
        data: { user },
        error: userError,
      } = await adminClient.auth.getUser(accessToken)

      if (userError || !user) {
        return new Response(
          JSON.stringify({
            error: { code: 'UNAUTHORIZED', message: 'Invalid access token' },
          }),
          { status: 401, headers: { 'content-type': 'application/json' } },
        )
      }

      if (!user.email) {
        return new Response(
          JSON.stringify({
            error: { code: 'UNAUTHORIZED', message: 'invalid user email' },
          }),
          { status: 401, headers: { 'content-type': 'application/json' } },
        )
      }

      const mockLogger = {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        setContext: vi.fn(),
        clearContext: vi.fn(),
      }

      // 実際のハンドラーを呼び出し（userを渡す）
      return handler(request, user, { ...context, logger: mockLogger })
    }
  }),
}))

vi.mock('@/lib/api/utils', () => ({
  getAccessTokenFromHeader: vi.fn(),
}))

vi.mock('@/lib/supabase/client/adminClient', () => ({
  adminClient: {
    auth: {
      getUser: vi.fn(),
    },
  },
}))

vi.mock('@/lib/supabase/auth/server/server', () => ({
  checkValidSessionLevel: vi.fn(),
  getCurrentUserId: vi.fn(),
}))

vi.mock('@/lib/log/serverLog', () => ({
  Logger: {
    getInstance: vi.fn(() => ({
      createRequestLogger: vi.fn(() => ({
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        setContext: vi.fn(),
        clearContext: vi.fn(),
      })),
    })),
  },
}))

vi.mock('@/lib/log/storage', () => ({
  setRequestLogger: vi.fn(),
  getRequestLogger: vi.fn(),
}))

// createClient は戻り値（.auth.signInWithPassword）だけ使うので全面モック
const signInWithPassword = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { signInWithPassword },
  })),
}))

const mockedGetToken = vi.mocked(getAccessTokenFromHeader)
const mockedGetUser = vi.mocked(adminClient.auth.getUser)
const mockedCheckLevel = vi.mocked(checkValidSessionLevel)

describe('POST /api/auth/password/verify (Route Handler)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    mockedGetToken.mockReset()
    mockedGetUser.mockReset()
    mockedCheckLevel.mockReset()
    signInWithPassword.mockReset()
  })

  it('401 when Authorization header missing', async () => {
    mockedGetToken.mockReturnValue(null)

    await testApiHandler({
      appHandler: handler, // POST を含む Route Handler オブジェクト
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'POST', body: '{}' })
        const json = await res.json()
        expect(res.status).toBe(401)
        expect(json).toEqual({
          error: { code: 'UNAUTHORIZED', message: 'Authorization header required' },
        })
      },
    })
  })

  it('401 when access token invalid', async () => {
    mockedGetToken.mockReturnValue('token-xyz')
    mockedGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid access token') as AuthError,
    })

    await testApiHandler({
      appHandler: handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify({ password: 'pw' }),
          headers: { 'content-type': 'application/json' },
        })
        const json = await res.json()
        expect(res.status).toBe(401)
        expect(json).toEqual({
          error: { code: 'UNAUTHORIZED', message: 'Invalid access token' },
        })
      },
    })
  })

  it('401 when user has no email', async () => {
    mockedGetToken.mockReturnValue('ok')
    mockedGetUser.mockResolvedValue({
      data: { user: { id: 'u1' } as User }, // email 無し
      error: null,
    })

    await testApiHandler({
      appHandler: handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify({ password: 'pw' }),
          headers: { 'content-type': 'application/json' },
        })
        const json = await res.json()
        expect(res.status).toBe(401)
        expect(json).toEqual({
          error: { code: 'UNAUTHORIZED', message: 'invalid user email' },
        })
      },
    })
  })

  it('401 when session level invalid', async () => {
    mockedGetToken.mockReturnValue('ok')
    mockedGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } as User },
      error: null,
    })
    mockedCheckLevel.mockResolvedValue({ valid: false })

    await testApiHandler({
      appHandler: handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify({ password: 'pw' }),
          headers: { 'content-type': 'application/json' },
        })
        const json = await res.json()
        expect(res.status).toBe(401)
        expect(json).toEqual({
          error: { code: 'UNAUTHORIZED', message: 'Invalid session level' },
        })
      },
    })
  })

  it('400 when password verification fails', async () => {
    mockedGetToken.mockReturnValue('ok')
    mockedGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } as User },
      error: null,
    })
    mockedCheckLevel.mockResolvedValue({ valid: true })
    signInWithPassword.mockResolvedValue({ data: null, error: new Error('nope') })

    await testApiHandler({
      appHandler: handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify({ password: 'wrong' }),
          headers: { 'content-type': 'application/json' },
        })
        const json = await res.json()
        expect(res.status).toBe(400)
        expect(json).toEqual({ error: { code: 'BAD_REQUEST', message: 'Bad request' } })
      },
    })
  })

  it('200 when verified', async () => {
    mockedGetToken.mockReturnValue('ok')
    mockedGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } as User },
      error: null,
    })
    mockedCheckLevel.mockResolvedValue({ valid: true })
    signInWithPassword.mockResolvedValue({ data: { user: { id: 'u2' } }, error: null })

    await testApiHandler({
      appHandler: handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          body: JSON.stringify({ password: 'pw' }),
          headers: { 'content-type': 'application/json' },
        })
        const json = await res.json()
        expect(res.status).toBe(200)
        expect(json).toEqual({ data: { valid: true } })
      },
    })
  })
})
