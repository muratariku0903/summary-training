'use client'

import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import TextInput from '@/components/elements/text-input/TextInput'
import {
  MessageType,
  OutlineMessage,
} from '@/components/elements/outline-message/OutlineMessage'
import { Spacer } from '@/components/elements/spacer/Spacer'
import ReversalButton from '@/components/elements/reversal-button/ReversalButton'
import { ResetPasswordInput, resetPasswordSchema } from '@/lib/supabase/auth/types'
import { resetPassword } from '@/lib/supabase/auth/auth'
import { UI_MESSAGES } from '@/lib/constants/ui'

export default function PasswordResetPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) })

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successRequest, setSuccessRequest] = useState(false)

  const onSubmit = async (input: ResetPasswordInput) => {
    setSubmitError(null)

    const { success, message } = await resetPassword(input)
    if (!success) {
      console.error(message)
      setSubmitError(UI_MESSAGES.RESET_PASSWORD_FAILED_MESSAGE)
      return
    }

    setSuccessRequest(true)
  }

  if (successRequest) {
    return (
      <>
        <Header menuType='member' />
        <Main>
          <div className='flex justify-center py-4'>
            <div className='w-full max-w-sm bg-white p-6 border-2 border-black text-center'>
              <h1 className='text-2xl font-semibold mb-4'>メール送信完了</h1>
              <p className='text-gray-700 mb-6'>
                メールアドレスにパスワードリセットのリンクが添付されたメールを送信しました。
                <br />
                メールボックスをご確認ください。
              </p>
            </div>
          </div>
        </Main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header menuType='member' />
      <Main>
        <div className='max-w-2xl mx-auto p-6 space-y-6'>
          <div></div>
          <div className='flex justify-center py-4'>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className='w-full max-w-sm space-y-4 bg-white p-6 border-2 border-black'
            >
              <h2 className='text-2xl font-bold mb-2'>パスワードリセット</h2>
              <TextInput
                labelText='メールアドレス'
                {...register('email')}
                errorMessage={errors['email']?.message}
              />
              <Spacer size={4} />
              {submitError && (
                <OutlineMessage message={submitError} type={MessageType.ERROR} />
              )}
              <ReversalButton
                type='submit'
                label={isSubmitting ? '送信中...' : 'パスワードをリセット'}
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
