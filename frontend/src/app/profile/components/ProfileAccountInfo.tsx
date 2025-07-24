'use client'

import OutlineButton from '@/components/elements/outline-button/OutlineButton'
import {
  MessageType,
  OutlineMessage,
} from '@/components/elements/outline-message/OutlineMessage'
import TextInput from '@/components/elements/text-input/TextInput'
import { PROTECTED_PATHS } from '@/lib/constants/routes'
import { AUTH_PROVIDERS, AuthProviders } from '@/lib/supabase/auth/types'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'

type ProfileAccountInfoProps = {
  user: User
  onClickDeleteAccount?: () => void
  onClickOAuthUnlink?: (provider: AuthProviders) => void
}

export default function ProfileAccountInfo({
  user,
  onClickDeleteAccount,
  onClickOAuthUnlink,
}: ProfileAccountInfoProps) {
  const router = useRouter()

  const authProviders = user.identities?.map((e) => e.provider)
  const hasEmailProvider = authProviders?.includes('email')
  const hasGoogleProvider = authProviders?.includes('google')

  return (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold'>アカウント情報</h2>

      <div className='space-y-4'>
        {hasEmailProvider && (
          <>
            <div className='space-y-2'>
              <TextInput
                labelText='メールアドレス'
                edit={false}
                showValue={user.email}
                rightElement={
                  <OutlineButton
                    label='変更'
                    onClick={() => router.replace(PROTECTED_PATHS.EMAIL_CHANGE)}
                    className='text-sm px-3 py-1'
                  />
                }
              />
            </div>

            <div className='space-y-2'>
              <TextInput
                labelText='パスワード'
                edit={false}
                showValue='••••••••'
                rightElement={
                  <OutlineButton
                    label='変更'
                    onClick={() => router.replace(PROTECTED_PATHS.PASSWORD_CHANGE)}
                    className='text-sm px-3 py-1'
                  />
                }
              />
            </div>

            <div className='space-y-2'>
              <label className='block  text-sm font-bold'>二段階認証</label>
              <div className='p-3 rounded border bg-gray-50 p-3'>
                <div className='flex items-center justify-between pb-2'>
                  <div>
                    <span
                      className={`text-sm ${
                        user.factors &&
                        user.factors.filter((f) => f.status === 'verified').length > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {user.factors &&
                      user.factors.filter((f) => f.status === 'verified').length > 0
                        ? '有効'
                        : '無効'}
                    </span>
                  </div>
                  <OutlineButton
                    label='管理'
                    onClick={() =>
                      router.replace(PROTECTED_PATHS.TWO_FACTOR_AUTHENTICATION)
                    }
                    className='text-sm px-3 py-1'
                  />
                </div>

                {user.factors &&
                user.factors.filter((f) => f.status === 'verified').length > 0 ? (
                  <div className='border-t border-gray-300 pt-3'>
                    <span className='block text-sm font-medium text-gray-700 mb-2'>
                      設定済み認証方法
                    </span>
                    <div className='space-y-1'>
                      {user.factors.map((factor, index) => (
                        <div key={index} className='text-sm text-gray-600'>
                          •{' '}
                          {factor.factor_type === 'totp'
                            ? 'TOTP認証'
                            : factor.factor_type}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <OutlineMessage
                    message='アカウントの安全性を高めるため、二段階認証の設定をお勧めします。'
                    type={MessageType.WARN}
                  />
                )}
              </div>
            </div>
          </>
        )}
        {hasGoogleProvider && (
          <>
            <div className='space-y-2'>
              <div className='flex items-center justify-between p-4 border rounded-md bg-white'>
                {/* アイコン＋文言 */}
                <div className='flex items-center space-x-2'>
                  <FcGoogle size={24} />
                  <span className='text-sm font-medium text-gray-800'>
                    Google アカウント連携中
                  </span>
                </div>
                {hasEmailProvider && (
                  <button
                    onClick={() => {
                      if (onClickOAuthUnlink) onClickOAuthUnlink(AUTH_PROVIDERS.GOOGLE)
                    }}
                    className='
          text-sm text-red-600 border border-red-600
          px-3 py-1 rounded hover:bg-red-50
          transition
        '
                  >
                    連携解除
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className='pt-6 border-t-2 border-gray-200'>
        <OutlineButton
          label='アカウントを削除'
          onClick={onClickDeleteAccount}
          color='danger'
        />
      </div>
    </div>
  )
}
