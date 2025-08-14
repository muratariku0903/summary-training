// app/api/e2e/auth/generate-link/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'

type Body = {
  type: 'signup' | 'magiclink' | 'recovery'
  email: string
  password?: string
  redirectTo?: string
}
const bad = (m: string, s = 400) =>
  NextResponse.json({ ok: false, error: m }, { status: s })

export async function POST(req: NextRequest) {
  if (process.env.E2E_ENABLED !== 'true') return new NextResponse(null, { status: 404 })
  if (req.headers.get('x-e2e-secret') !== process.env.E2E_SECRET)
    return bad('unauthorized', 401)

  const { type, email, password, redirectTo }: Body = await req.json()
  if (!type || !email || !password) return bad('type and email and password are required')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const srv = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !srv) return bad('server misconfigured', 500)

  const admin = createClient(url, srv, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await admin.auth.admin.generateLink({
    type,
    email,
    password,
    options: { redirectTo },
  })
  if (error || !data) return bad(error?.message || 'generateLink failed', 500)

  // ① action_link から token を抽出（/auth/v1/verify?token=...）
  const u = new URL(data.properties.action_link)
  const token = u.searchParams.get('token')
  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'token not found in action_link' },
      { status: 500 },
    )
  }

  // ② 自前の callback に token & email（＆type）を付けて返す
  const origin = new URL(req.url).origin
  const e2eLink =
    `${origin}/api/e2e/auth/callback` +
    `?token=${encodeURIComponent(token)}` +
    `&email=${encodeURIComponent(email)}` +
    `&type=${encodeURIComponent(type)}`

  return NextResponse.json({ ok: true, action_link: e2eLink }, { status: 200 })
}
