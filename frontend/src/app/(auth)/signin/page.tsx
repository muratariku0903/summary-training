'use client'

import { useState } from 'react'
import Header from '@/components/layouts/header/Header'
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
import { MfaFactor, SigninInput, signinSchema } from '@/lib/supabase/auth/types'
import { signIn } from '@/lib/supabase/auth/auth'
import { useRouter } from 'next/navigation'
import { PROTECTED_PATHS, PUBLIC_PATHS } from '@/lib/constants/routes'
import { UI_MESSAGES } from '@/lib/constants/ui'
import MfaVerificationInput from '@/components/features/auth/MfaVerificationInput'
import MfaSelection from '@/components/features/auth/MfaSelection'
import Link from 'next/link'
import { useSnackbarStore } from '@/stores/useSnackbarStore'
import { browserClient } from '@/lib/supabase/client/browserClient'
import GoogleSignInButton from '@/components/elements/google-button/GoogleButton'
import PasskeySignInButton from '@/components/elements/passkey-button/PasskeyButton'
import { S } from '../../../../test/e2e/const/selector'
import { clientLogger } from '@/stores/useClientLoggerStore'

export default function SignInPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninInput>({ resolver: zodResolver(signinSchema) })

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showMfaSelection, setShowMfaSelection] = useState(false)
  const [selectableMFAList, setSelectableMFAList] = useState<MfaFactor[]>([])
  const [selectedMFA, setSelectedMFA] = useState<MfaFactor | null>(null)
  const showSnackbar = useSnackbarStore((s) => s.show)

  const onSubmit = async (input: SigninInput) => {
    setSubmitError(null)

    // サインイン処理
    const { success, message, requiresMfa, mfaFactors } = await signIn(input)
    if (!success) {
      clientLogger.error('Signin failed', Error(message))
      setSubmitError(UI_MESSAGES.SIGNIN_FAILED_MESSAGE)
      return
    }

    // MFA設定をしてない場合はそのままログイン成功とみなし、ダッシュボードなどへリダイレクト
    if (!requiresMfa) {
      showSnackbar(UI_MESSAGES.SIGNIN_SUCCESS_MESSAGE, 'success')
      router.replace(PROTECTED_PATHS.DASHBOARD)
      return
    }

    // MFAが設定されている場合、そしてそのMFAが複数存在する場合ユーザーに検証パターンを選択させる
    if (mfaFactors.length >= 2) {
      setSelectableMFAList(mfaFactors)
      setShowMfaSelection(true)
      return
    }

    // 設定されているMFAが一つしかない場合は強制的にその検証パターンのステップに進む
    setSelectedMFA(mfaFactors[0])
  }

  // MFAの検証方法が選択されている場合はそれぞれに合わせた検証画面を表示
  if (selectedMFA) {
    return (
      <>
        <Header />
        <Main>
          <MfaVerificationInput
            selectedMFA={selectedMFA}
            onVerifyComplete={() => {
              showSnackbar(UI_MESSAGES.SIGNIN_SUCCESS_MESSAGE, 'success')
              router.replace(PROTECTED_PATHS.DASHBOARD)
            }}
          />
        </Main>
        <Footer />
      </>
    )
  }

  // MFA選択画面の表示
  if (showMfaSelection) {
    return (
      <>
        <Header />
        <Main>
          <MfaSelection
            selectableMFAList={selectableMFAList}
            selectedMFA={selectedMFA}
            onMfaSelect={setSelectedMFA}
          />
        </Main>
        <Footer />
      </>
    )
  }

  // ログイン情報入力画面
  return (
    <>
      <Header />
      <Main>
        <div className='flex justify-center py-4'>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='w-full max-w-sm space-y-4 bg-white p-6 border-2 border-black'
          >
            <h1 className='text-center text-2xl font-semibold'>ログイン</h1>
            <TextInput
              labelText='メールアドレス'
              {...register('email')}
              errorMessage={errors['email']?.message}
              testId={S.signinEmailInput}
            />
            <TextInput
              labelText='パスワード'
              {...register('password')}
              errorMessage={errors['password']?.message}
              testId={S.signinPasswordInput}
            />
            <Spacer size={4} />
            {submitError && (
              <OutlineMessage message={submitError} type={MessageType.ERROR} />
            )}
            <ReversalButton
              type='submit'
              label={isSubmitting ? 'ログイン中...' : 'ログイン'}
              border
              disable={isSubmitting}
              testId={S.signinBtn}
            />
            <div className='pt-4'>
              <Link
                href={PUBLIC_PATHS.SIGNUP}
                className='text-sm text-blue-600 hover:text-blue-800 underline'
              >
                新規会員登録はこちら
              </Link>
              <Spacer size={10} />
              <Link
                href={PUBLIC_PATHS.PASSWORD_RESET}
                className='text-sm text-blue-600 hover:text-blue-800 underline'
              >
                パスワードを忘れてしまった場合はこちら
              </Link>
            </div>
            <Spacer size={5} />
            <GoogleSignInButton
              onClick={async () => {
                const { error } = await browserClient.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: `${window.location.origin}/api/auth/callback?redirectTo=${PROTECTED_PATHS.DASHBOARD}`,
                  },
                })
                if (error) {
                  clientLogger.error('Signin with OAuth failed', error)
                  setSubmitError(UI_MESSAGES.SIGNIN_FAILED_MESSAGE)
                  return
                }
              }}
            />
            <PasskeySignInButton
              onClick={() => router.replace(PUBLIC_PATHS.SIGNIN_PASSKEY)}
            />
          </form>
        </div>
      </Main>
      <Footer />
    </>
  )
}
