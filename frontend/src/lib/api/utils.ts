import { NextRequest } from 'next/server'

export const getAccessTokenFromHeader = (req: NextRequest): string | null => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ Not found Bearer token')
    return null
  }
  
  return authHeader.replace('Bearer ', '')
}
