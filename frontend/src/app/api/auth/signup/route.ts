import { NextRequest, NextResponse } from 'next/server'
// import { serverClient } from '@/lib/supabase/serverClient'
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

export type SignUpPostRequest = z.infer<typeof requestSchema>
export type SignUpPostResponse = z.infer<typeof responseSchema>

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const body = await req.json()
  const parse = requestSchema.safeParse(body)
  if (!parse.success) {
    return BadRequest('Invalid payload', parse.error).toResponse()
  }

  const { email, password, userName } = parse.data

  return Created({ userId: 'userId' }).toResponse()
  /* ① Supabase signUp -> メール確認メールが自動送信 */
  // const { data, error } = await serverClient.auth.signUp({
  //   email,
  //   password,
  //   options: { data: { userName } },
  // })

  // if (error) {
  //   return InternalError('Internal server error', error.message).toResponse()
  // }
  /* pending user が戻るだけ。フロントではメール確認案内へ遷移 */
  return Created({ userId: 'userId' }).toResponse()
}
