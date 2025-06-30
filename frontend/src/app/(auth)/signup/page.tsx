'use client'

import { useState } from 'react'
import Header, { HeaderMenuType } from '@/components/layouts/header/Header'
import Footer from '@/components/layouts/footer/Footer'
import Main from '@/components/layouts/main/Main'
import ReversalButton from '@/components/elements/reversal-button/ReversalButton'
import TextInput from '@/components/elements/text-input/TextInput'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Spacer } from '@/components/elements/spacer/Spacer'
import {
  MessageType,
  OutlineMessage,
} from '@/components/elements/outline-message/OutlineMessage'
import { SignupInput, signupSchema } from '@/lib/supabase/auth/types'
import { signUp } from '@/lib/supabase/auth/auth'
import { UI_MESSAGES } from '@/lib/constants/ui'

export default function SignUpPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) })

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const onSubmit = async (input: SignupInput) => {
    setSubmitError(null)

    const { success, message } = await signUp(input)
    console.log(message)
    if (!success) {
      setSubmitError(UI_MESSAGES.UNEXPECTED_ERROR)

      return
    }

    setIsSuccess(true)
  }

  if (isSuccess) {
    return (
      <>
        <Header menuType={HeaderMenuType.HIDDEN} />
        <Main>
          <div className='flex justify-center py-4'>
            <div className='w-full max-w-sm bg-white p-6 border-2 border-black text-center'>
              <h1 className='text-2xl font-semibold mb-4'>メール送信完了</h1>
              <p className='text-gray-700 mb-6'>
                確認メールを送信しました。
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
      <Header menuType={HeaderMenuType.HIDDEN} />
      <Main>
        <div className='flex justify-center py-4'>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='w-full max-w-sm space-y-4 bg-white p-6 border-2 border-black'
          >
            <h1 className='text-center text-2xl font-semibold'>新規登録</h1>
            <TextInput
              labelText='ユーザーネーム'
              {...register('userName')}
              errorMessage={errors['userName']?.message}
            />
            <TextInput
              labelText='メールアドレス'
              {...register('email')}
              errorMessage={errors['email']?.message}
            />
            <TextInput
              labelText='パスワード'
              {...register('password')}
              errorMessage={errors['password']?.message}
            />
            <TextInput
              labelText='パスワード（確認用）'
              {...register('confirmPassword')}
              errorMessage={errors['confirmPassword']?.message}
            />
            <Spacer size={4} />
            {submitError && (
              <OutlineMessage message={submitError} type={MessageType.ERROR} />
            )}
            <ReversalButton
              label={isSubmitting ? '登録中...' : '登録'}
              className='w-full'
              border
              disable={isSubmitting}
            />
            <p className='text-center text-sm'>
              すでにアカウントをお持ちの方は{' '}
              <a
                href='/login'
                className='text-xs font-medium text-indigo-600 hover:underline'
              >
                こちら
              </a>
            </p>
          </form>
        </div>
      </Main>
      <Footer />
    </>
  )
}
