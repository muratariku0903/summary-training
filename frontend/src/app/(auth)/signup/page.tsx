'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layouts/header/Header'
import Footer from '@/components/layouts/footer/Footer'
import Main from '@/components/layouts/main/Main'
import ReversalButton from '@/components/elements/reversal-button/ReversalButton'
import TextInput from '@/components/elements/text-input/TextInput'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Spacer } from '@/components/elements/spacer/Spacer'
import { ApiError } from 'next/dist/server/api-utils'
import { isRequestError, post } from '@/lib/api/client'
import { SignUpPostRequest, SignUpPostResponse } from '@/app/api/auth/signup/route'
// import { supabase } from "@/lib/supabase";

export default function SignUpPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) })

  const [submitError, setSubmitError] = useState<string | null>(null)

  // const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (data: SignUpInput) => {
    // setSubmitError(null)
    const request: SignUpPostRequest = {
      userName: data.userName,
      email: data.email,
      password: data.password,
    }
    try {
      const res = await post('/auth/signup', request)
      if (isRequestError(res)) {
        console.log(res)

        return
      }
      console.log('data', res.data)
    } catch (e) {
      console.log(e)
    }

    // const { error } = await supabase.auth.signUp({
    //   email: data.email,
    //   password: data.password,
    //   options: { data: { username: data.username } }, // 任意メタデータ
    // })
    // if (error) {
    //   setSubmitError(error.message)
    //   return
    // }
    // router.push('/auth/mfa/enroll')
  }

  return (
    <>
      <Header enableMenu={false} />
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
            <ReversalButton label='登録' className='w-full' border />
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

const signUpSchema = z
  .object({
    userName: z.string().min(2, '2文字以上で入力してください'),
    email: z.string().email('メール形式で入力してください'),
    password: z
      .string()
      .min(8, '8 文字以上で入力してください')
      .regex(/[A-Z]/, '大文字を1文字以上含めてください')
      .regex(/[a-z]/, '小文字を1文字以上含めてください')
      .regex(/[0-9]/, '数字を1文字以上含めてください'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })
type SignUpInput = z.infer<typeof signUpSchema>
