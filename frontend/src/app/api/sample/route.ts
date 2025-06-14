import { NextRequest, NextResponse } from 'next/server'
import { BadRequest, Created, InternalError } from '@/lib/api/response'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  userName: z.string().min(2),
})

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const body = await req.json()
  const parse = schema.safeParse(body)
  console.log(`parse.success: ${parse.success}`)
  if (!parse.success) {
    return BadRequest('Invalid payload', parse.error).toResponse()
  }

  const { email } = parse.data
  /* ① Supabase signUp -> メール確認メールが自動送信 */

  if (email === 'error@gmail.com') {
    return InternalError('Internal server error', 'error email').toResponse()
  }
  /* pending user が戻るだけ。フロントではメール確認案内へ遷移 */
  return Created({ userId: 'userId' }).toResponse()
}
