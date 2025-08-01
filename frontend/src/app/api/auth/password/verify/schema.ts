import { z } from 'zod'

export const requestSchema = z.object({
  password: z.string(),
})

export const responseSchema = z.object({
  valid: z.boolean(),
})
