import { z } from 'zod'

export const requestSchema = z.object({
  idpToken: z.string(),
})

export const responseSchema = z.object({
  message: z.string(),
})
