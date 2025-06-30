import { NextRequest, NextResponse } from 'next/server'
import { serverClient } from '@/lib/supabase/serverClient'
import { z } from 'zod'
import { BadRequest, Created, InternalError } from '@/lib/api/response'

export const requestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  userName: z.string().min(2),
})

export const responseSchema = z.object({
  userId: z.string(),
})

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const body = await req.json()
  const parse = requestSchema.safeParse(body)
  if (!parse.success) {
    return BadRequest('Invalid payload', parse.error).toResponse()
  }

  const { email, password, userName } = parse.data

  // リクエストヘッダーからホストを取得
  const host = req.headers.get('host')
  const protocol = req.headers.get('x-forwarded-proto') || 'http'
  const baseUrl = `${protocol}://${host}`

  // Supabase signUp -> メール確認メールが自動送信
  // ↓によると、既に登録済みのメールアドレスが指定されいる場合でもエラーが返却されないみたい。ただこれは意図的なセキュリティ対策としている
  // https://github.com/supabase/auth-js/issues/513
  const { data, error } = await serverClient.auth.signUp({
    email,
    password,
    options: {
      data: { userName },
      emailRedirectTo: `${baseUrl}/callback`,
    },
  })

  if (error) {
    return InternalError('Internal server error', error.message).toResponse()
  }
  /* pending user が戻るだけ。フロントではメール確認案内へ遷移 */
  return Created({ userId: data.user?.id }).toResponse()
}
