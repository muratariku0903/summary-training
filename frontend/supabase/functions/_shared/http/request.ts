import { z, ZodRawShape } from 'https://esm.sh/zod@3.23.8'
import { Result } from '../types/common.ts'

export const requestParse = async <T extends ZodRawShape>(
  req: Request,
  schema: z.ZodObject<T>,
): Promise<Result<z.infer<z.ZodObject<T>>>> => {
  console.log('req: ', req)

  try {
    const body = await req.json()

    const {
      success: parseSuccess,
      data: parseData,
      error: parseError,
    } = schema.safeParse(body)
    if (!parseSuccess) {
      return { success: false, error: Error(String(parseError)) }
    }

    return { success: true, data: parseData }
  } catch (e) {
    return { success: false, error: Error(String(e)) }
  }
}
