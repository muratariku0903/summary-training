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
import { ChangeEmailInput, changeEmailSchema } from '@/lib/supabase/auth/types'
import { changeEmail } from '@/lib/supabase/auth/auth'
import { UI_MESSAGES } from '@/lib/constants/ui'
import { S } from '../../../../test/e2e/const/selector'
import { clientLogger } from '@/stores/useClientLoggerStore'

export default function EmailChangePage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangeEmailInput>({ resolver: zodResolver(changeEmailSchema) })

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successUpdateEmailRequest, setSuccessUpdateEmailRequest] = useState(false)

  const onSubmit = async (input: ChangeEmailInput) => {
    setSubmitError(null)

    const { success, message } = await changeEmail(input)
    if (!success) {
      clientLogger.error('Email change failed', new Error(message), { message })
      setSubmitError(UI_MESSAGES.CHANGE_EMAIL_FAILED_MESSAGE)
      return
    }

    setSuccessUpdateEmailRequest(true)
  }

  if (successUpdateEmailRequest) {
    return (
      <>
        <Header menuType='member' />
        <Main>
          <div className='flex justify-center py-4'>
            <div className='w-full max-w-sm bg-white p-6 border-2 border-black text-center'>
              <h1 className='text-2xl font-semibold mb-4'>メール送信完了</h1>
              <p className='text-gray-700 mb-6'>
                新しいメールアドレスに確認メールを送信しました。
                <br />
                メールボックスをご確認ください。
                <br />
                確認が完了するまでメールアドレスは反映されません。
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
              <h2 className='text-2xl font-bold mb-2'>メールアドレス再設定</h2>
              <TextInput
                labelText='新しいメールアドレス'
                {...register('email')}
                errorMessage={errors['email']?.message}
                testId={S.newEmailInput}
              />
              <Spacer size={4} />
              {submitError && (
                <OutlineMessage message={submitError} type={MessageType.ERROR} />
              )}
              <ReversalButton
                type='submit'
                label={isSubmitting ? '送信中...' : 'メールアドレスを変更'}
                border
                disable={isSubmitting}
                testId={S.updateEmailBtn}
              />
            </form>
          </div>
        </div>
      </Main>
      <Footer />
    </>
  )
}
