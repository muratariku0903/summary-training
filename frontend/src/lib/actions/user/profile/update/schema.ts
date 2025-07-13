import z from 'zod'

// バリデーションスキーマ
export const updateProfileSchema = z.object({
  user_name: z
    .string()
    .min(1, 'ユーザー名は必須です')
    .max(50, 'ユーザー名は50文字以内で入力してください'),
  display_name: z
    .string()
    .min(1, '表示名は必須です')
    .max(100, '表示名は100文字以内で入力してください'),
  bio: z.string().max(500, '自己紹介は500文字以内で入力してください').optional(),
})
export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>
