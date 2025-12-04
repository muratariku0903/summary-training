import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/client/serverComponentClient'

export async function GET(req: NextRequest) {
  if (process.env.E2E_ENABLED !== 'true') return new NextResponse(null, { status: 404 })

  const { searchParams, origin } = new URL(req.url)
  const token = searchParams.get('token')
  const next = searchParams.get('next') || '/'

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    return NextResponse.json(
      { ok: false, error: 'server misconfigured' },
      { status: 500 },
    )
  }

  const supabase = await createServerComponentClient()

  if (token) {
    const { error } = await supabase.auth.verifyOtp({ type: 'email', token_hash: token })
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }
  }

  // クッキーが設定された状態でダッシュボードへ
  return NextResponse.redirect(new URL(next, origin))
}
