'use client'

import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useSnackbarStore } from '@/stores/useSnackbarStore'
import TextInput from '@/components/elements/text-input/TextInput'
import {
  MessageType,
  OutlineMessage,
} from '@/components/elements/outline-message/OutlineMessage'
import { Spacer } from '@/components/elements/spacer/Spacer'
import ReversalButton from '@/components/elements/reversal-button/ReversalButton'
import { PROTECTED_PATHS } from '@/lib/constants/routes'
import {
  ChangePasswordInput,
  changePasswordSchemaRequireCurrentPassword,
} from '@/lib/supabase/auth/types'
import { changePassword } from '@/lib/supabase/auth/auth'
import { UI_MESSAGES } from '@/lib/constants/ui'
import { request } from '@/lib/api/client'
import { SENDING_PATTERN } from '@/lib/constants/email'

export default function PasswordChangePage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchemaRequireCurrentPassword),
  })

  const [submitError, setSubmitError] = useState<string | null>(null)
  const showSnackbar = useSnackbarStore((s) => s.show)

  const onSubmit = async (input: ChangePasswordInput) => {
    setSubmitError(null)

    // パスワード変更処理
    const { success, message } = await changePassword(input)
    if (!success) {
      console.error(message)
      setSubmitError(UI_MESSAGES.CHANGE_PASSWORD_FAILED_MESSAGE)
      return
    }

    const sendEmailParams = { pattern: SENDING_PATTERN.PASSWORD_CHANGE_NOTIFICATION }
    const { error: sendingError } = await request(
      '/email/post',
      'post',
      sendEmailParams,
      {
        requireAuth: true,
      },
    )
    if (sendingError) {
      console.warn('fail sending mail', sendingError)
    }
    showSnackbar(UI_MESSAGES.CHANGE_PASSWORD_SUCCESS_MESSAGE, 'success')
    router.replace(PROTECTED_PATHS.PROFILE)
  }

  return (
    <>
      <Header menuType='member' />
      <Main>
        <div className='max-w-2xl mx-auto p-6 space-y-6'>
          <div>
            <h2 className='text-2xl font-bold mb-2'>パスワード再設定</h2>
          </div>
          <div className='flex justify-center py-4'>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className='w-full max-w-sm space-y-4 bg-white p-6 border-2 border-black'
            >
              <TextInput
                labelText='現在のパスワード'
                {...register('currentPassword')}
                errorMessage={errors['currentPassword']?.message}
                type='password'
              />
              <TextInput
                labelText='新しいパスワード'
                {...register('newPassword')}
                errorMessage={errors['newPassword']?.message}
                type='password'
              />
              <TextInput
                labelText='新しいパスワード（確認用）'
                {...register('confirmNewPassword')}
                errorMessage={errors['confirmNewPassword']?.message}
                type='password'
              />
              <Spacer size={4} />
              {submitError && (
                <OutlineMessage message={submitError} type={MessageType.ERROR} />
              )}
              <ReversalButton
                type='submit'
                label={isSubmitting ? '変更中...' : 'パスワードを変更'}
                border
                disable={isSubmitting}
              />
            </form>
          </div>
        </div>
      </Main>
      <Footer />
    </>
  )
}
