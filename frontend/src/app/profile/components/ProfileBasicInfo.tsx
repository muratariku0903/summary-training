'use client'

import { updateProfileAction } from '@/lib/server-actions/user/profile/update/action'
import {
  updateProfileSchema,
  UpdateProfileSchema,
} from '@/lib/server-actions/user/profile/update/schema'
import { UserProfile } from '@/lib/supabase/schema/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useActionState, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import TextInput from '@/components/elements/text-input/TextInput'
import { formatDate, formatDateTime } from '@/utils/date'
import TextArea from '@/components/elements/text-area/TextArea'
import ProfileAvatar from './ProfileAvatar'
import ReversalButton from '@/components/elements/reversal-button/ReversalButton'
import OutlineButton from '@/components/elements/outline-button/OutlineButton'
import { useSnackbarStore } from '@/stores/useSnackbarStore'
import { UI_MESSAGES } from '@/lib/constants/ui'
import { S } from '../../../../test/e2e/const/selector'

type ProfileBasicInfoProps = {
  profile: UserProfile
}

export default function ProfileBasicInfo({ profile }: ProfileBasicInfoProps) {
  const showSnackbar = useSnackbarStore((s) => s.show)
  const [state, formAction, isPending] = useActionState<UserProfile, UpdateProfileSchema>(
    async (state, payload) => {
      const { success, data, error } = await updateProfileAction(payload)
      if (!success) {
        setError(error)
        return state
      }
      showSnackbar(UI_MESSAGES.PROFILE_UPDATE_SUCCESS_MESSAGE, 'success')
      setError(null)

      return data
    },
    profile,
  )

  const [, startTransition] = useTransition() // transactionPending を削除
  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm({ resolver: zodResolver(updateProfileSchema) })

  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className='space-y-6'>
      {/* エラーメッセージ */}
      {error && (
        <div className='p-4 bg-red-100 border-2 border-red-500 text-red-700 rounded'>
          <button
            onClick={() => setError(null)}
            className='float-right text-red-500 hover:text-red-700'
          >
            ×
          </button>
          {error}
        </div>
      )}

      <div className='flex items-center justify-between mb-6 gap-6'>
        <div className='flex items-center space-x-4'>
          {/* プロフィール画像 */}
          <ProfileAvatar avatarUrl={state.avatar_url} size='md' />
          <div>
            <h1 className='text-2xl font-bold'>{state.display_name}</h1>
            <p className='text-gray-600'>ID: {state.id}</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit((data) => {
          setError(null) // フォーム送信時にエラーをクリア
          startTransition(() => {
            formAction(data)
            setIsEditing(false)
          })
        })}
      >
        <div className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <TextInput
                labelText='ユーザー名'
                edit={isEditing}
                showValue={state.user_name}
                {...register('user_name')}
                defaultValue={state.user_name ?? ''}
                errorMessage={errors['user_name']?.message}
              />
            </div>

            <div className='space-y-2'>
              <TextInput
                labelText='表示名'
                edit={isEditing}
                showValue={state.display_name}
                {...register('display_name')}
                defaultValue={state.display_name ?? ''}
                errorMessage={errors['display_name']?.message}
                testId={S.profileBasicInfoDisplayNameInput}
              />
            </div>
            <div className='space-y-2'>
              <TextInput
                labelText='登録日'
                edit={false}
                showValue={formatDate(state.created_at)}
              />
            </div>
            <div className='space-y-2'>
              <TextInput
                labelText='最終更新'
                edit={false}
                showValue={formatDateTime(state.updated_at)}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <TextArea
              labelText='自己紹介'
              edit={isEditing}
              showValue={state.bio}
              {...register('bio')}
              defaultValue={state.bio || ''}
              className='w-full p-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black min-h-[100px]'
              placeholder='自己紹介を入力してください'
              rows={4}
              errorMessage={errors['bio']?.message}
              testId={S.profileBasicInfoBioInput}
            />
          </div>
          {/* 編集ボタン */}
          <div className='flex space-x-2'>
            {isEditing ? (
              <>
                <OutlineButton
                  label='キャンセル'
                  onClick={() => {
                    setIsEditing(false)
                    setError(null)
                    clearErrors()
                  }}
                  disable={isPending}
                />
                <ReversalButton
                  label='保存'
                  type='submit'
                  disable={isPending}
                  border
                  testId={S.profileBasicInfoSaveBtn}
                />
              </>
            ) : (
              <ReversalButton
                label='編集'
                onClick={() => setIsEditing(true)}
                border
                testId={S.profileBasicInfoEditBtn}
              />
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
