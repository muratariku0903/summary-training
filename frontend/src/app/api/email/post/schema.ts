import { SENDING_PATTERN } from '@/lib/constants/email'
import { z } from 'zod'

export const requestSchema = z.object({
  pattern: z.nativeEnum(SENDING_PATTERN),
})

export const responseSchema = z.object({
  message: z.boolean(),
})
