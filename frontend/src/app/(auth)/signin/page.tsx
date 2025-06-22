'use client'

import { useState } from 'react'
import Header from '@/components/layouts/header/Header'
import Footer from '@/components/layouts/footer/Footer'
import Main from '@/components/layouts/main/Main'
import ReversalButton from '@/components/elements/reversal-button/ReversalButton'
import TextInput from '@/components/elements/text-input/TextInput'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Spacer } from '@/components/elements/spacer/Spacer'
import { isRequestError, post } from '@/lib/api/client'
import {
  MessageType,
  OutlineMessage,
} from '@/components/elements/outline-message/OutlineMessage'

export default function SignInPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) })

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const onSubmit = async (data: SignInInput) => {
    setSubmitError(null)

    const request = {
      email: data.email,
      password: data.password,
    }

    try {
      const res = await post('/auth/signin', request)
      if (isRequestError(res)) {
        console.log(res)
        setSubmitError(
          'ログインに失敗しました。メールアドレスまたはパスワードをご確認ください。'
        )
        return
      }
      console.log('data', res.data)
      setIsSuccess(true)
      // 成功時の処理（例：リダイレクト）
      // router.push('/dashboard')
    } catch (e) {
      console.log(e)
      setSubmitError('ログインに失敗しました。しばらく経ってからもう一度お試しください。')
    }
  }

  if (isSuccess) {
    return (
      <>
        <Header />
        <Main>
          <div className='container mx-auto max-w-md px-4 py-8'>
            <OutlineMessage
              message='ログインに成功しました。'
              type={MessageType.success}
            />
          </div>
        </Main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header enableMenu={false} />
      <Main>
        <div className='container mx-auto max-w-md px-4 py-8'>
          <h1 className='text-2xl font-bold text-center mb-8'>ログイン</h1>

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <div>
              <TextInput
                label='メールアドレス'
                type='email'
                placeholder='example@example.com'
                {...register('email')}
                error={errors.email?.message}
              />
            </div>

            <div>
              <TextInput
                label='パスワード'
                type='password'
                placeholder='パスワードを入力'
                {...register('password')}
                error={errors.password?.message}
              />
            </div>

            <Spacer size={24} />

            {submitError && (
              <>
                <OutlineMessage message={submitError} type={MessageType.error} />
                <Spacer size={16} />
              </>
            )}

            <ReversalButton type='submit' disabled={isSubmitting} className='w-full'>
              {isSubmitting ? 'ログイン中...' : 'ログイン'}
            </ReversalButton>
          </form>

          <Spacer size={32} />

          <div className='text-center'>
            <p className='text-sm text-gray-600'>
              アカウントをお持ちでない方は{' '}
              <a href='/signup' className='text-blue-600 hover:text-blue-800 underline'>
                新規登録
              </a>
            </p>
          </div>
        </div>
      </Main>
      <Footer />
    </>
  )
}

const signInSchema = z.object({
  email: z.string().email('メール形式で入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
})

type SignInInput = z.infer<typeof signInSchema>
