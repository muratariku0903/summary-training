import { z } from 'zod'
import { getRequestLogger } from '../log/storage'

export type ValidationResult<T> =
  | {
      success: true
      data: T
      error?: never
    }
  | {
      success: false
      data?: never
      error: string
    }

/**
 * フォームデータをZodスキーマでバリデーションする汎用関数
 * @param formData - FormData オブジェクト
 * @param schema - Zod バリデーションスキーマ
 * @param fieldMapping - FormDataのフィールド名とスキーマのフィールド名のマッピング（オプション）
 * @returns バリデーション結果
 */
export function validateFormData<T extends z.ZodRawShape>(
  formData: FormData,
  schema: z.ZodObject<T>,
): ValidationResult<z.infer<z.ZodObject<T>>> {
  const logger = getRequestLogger()

  try {
    // FormDataから値を抽出
    const rawData: Record<string, unknown> = {}

    // スキーマから期待するフィールド名を取得
    const schemaShape = schema.shape
    Object.keys(schemaShape).forEach((key) => {
      const value = formData.get(key)
      if (value !== null) {
        rawData[key] = value
      }
    })

    // バリデーション実行
    const result = schema.safeParse(rawData)

    if (!result.success) {
      return {
        success: false,
        error: result.error.issues[0].message,
      }
    }

    return {
      success: true,
      data: result.data,
    }
  } catch (e) {
    logger.error('validation error', e)
    return {
      success: false,
      error: 'バリデーション処理中にエラーが発生しました',
    }
  }
}
