// app/api/e2e/users/delete-self/route.ts だったものを「バルク削除」対応に修正
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status })
}

type ReqBody = {
  prefix?: string // 例: "e2e" / "e2e_"
  dryRun?: boolean // true のときは削除せず件数だけ返す
}

export async function POST(req: NextRequest) {
  if (process.env.E2E_ENABLED !== 'true') return new NextResponse(null, { status: 404 })
  if (req.headers.get('x-e2e-secret') !== process.env.E2E_SECRET)
    return bad('unauthorized', 401)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !serviceRole) return bad('server misconfigured', 500)

  const { prefix = 'e2e', dryRun = false } = (await safeJson<ReqBody>(req)) ?? {}

  const admin = createAdminClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ページングしながら全ユーザーを走査
  const perPage = 1000
  let page = 1
  let totalMatched = 0
  let totalDeleted = 0
  const matched: Array<{ id: string; email: string | null }> = []

  // listUsers の戻り値構造は SDK バージョンで多少違うため、"users" 配列を都度取り出す
  // 返ってくる users が 0 件になったら終了
  // （SDK によっては total/lastPage が入ることもあるが、ここでは件数ベースで抜ける）

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) return bad(`listUsers failed (page=${page}): ${error.message}`, 500)

    const users = data.users

    if (!users.length) break

    for (const u of users) {
      const email: string | null = u.email ?? null
      if (!email) continue
      if (email.toLowerCase().startsWith(prefix.toLowerCase())) {
        matched.push({ id: u.id, email })
      }
    }

    // 次ページへ
    page += 1
  }

  totalMatched = matched.length

  if (!dryRun) {
    // バッチ削除（直列で確実に。大量なら Promise.allSettled でもOK）
    for (const { id } of matched) {
      const { error: delErr } = await admin.auth.admin.deleteUser(id)
      if (!delErr) {
        totalDeleted += 1
      } else {
        // 失敗は収集だけして続行
        console.error('[e2e-delete] failed:', id, delErr.message)
      }
    }
  }

  // 代表 20 件だけ返す（ログ肥大防止）
  const sample = matched.slice(0, 20)

  return NextResponse.json({
    ok: true,
    prefix,
    dryRun,
    matched: totalMatched,
    deleted: dryRun ? 0 : totalDeleted,
    sample,
  })
}

// --- helpers ---
async function safeJson<T>(req: NextRequest): Promise<T | null> {
  try {
    if (req.headers.get('content-type')?.includes('application/json')) {
      return (await req.json()) as T
    }
  } catch {
    // ignore
  }
  return null
}
