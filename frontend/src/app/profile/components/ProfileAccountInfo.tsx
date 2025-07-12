'use client'

import OutlineButton from '@/components/elements/outline-button/OutlineButton'
import {
  MessageType,
  OutlineMessage,
} from '@/components/elements/outline-message/OutlineMessage'
import { PROTECTED_PATHS } from '@/lib/constants/routes'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type ProfileAccountInfoProps = {
  user: User
  onClickDeleteAccount?: () => void
}

export default function ProfileAccountInfo({
  user,
  onClickDeleteAccount,
}: ProfileAccountInfoProps) {
  const router = useRouter()

  return (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold'>アカウント情報</h2>

      <div className='space-y-4'>
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-gray-700'>
            メールアドレス
          </label>
          <div className='flex items-center justify-between p-3 border-2 border-black bg-gray-50'>
            <span>{user.email}</span>
            <button className='px-3 py-1 text-sm border-2 border-black bg-white hover:bg-gray-100 transition-colors'>
              編集
            </button>
          </div>
        </div>

        <div className='space-y-2'>
          <label className='block text-sm font-medium text-gray-700'>パスワード</label>
          <div className='flex items-center justify-between p-3 border-2 border-black bg-gray-50'>
            <span>••••••••</span>
            <button className='px-3 py-1 text-sm border-2 border-black bg-white hover:bg-gray-100 transition-colors'>
              変更
            </button>
          </div>
        </div>

        <div className='space-y-2'>
          <label className='block text-sm font-medium text-gray-700'>二段階認証</label>
          <div className='p-3 border-2 border-black bg-gray-50 space-y-3'>
            <div className='flex items-center justify-between'>
              <div>
                <span
                  className={`text-sm ${
                    user.factors && user.factors.length > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {user.factors && user.factors.length > 0 ? '有効' : '無効'}
                </span>
              </div>
              <OutlineButton
                label='管理'
                onClick={() => router.replace(PROTECTED_PATHS.TWO_FACTOR_AUTHENTICATION)}
                className='text-sm px-3 py-1'
              />
            </div>

            {user.factors && user.factors.length > 0 ? (
              <div className='border-t border-gray-300 pt-3'>
                <span className='block text-sm font-medium text-gray-700 mb-2'>
                  設定済み認証方法
                </span>
                <div className='space-y-1'>
                  {user.factors.map((factor, index) => (
                    <div key={index} className='text-sm text-gray-600'>
                      • {factor.factor_type === 'totp' ? 'TOTP認証' : factor.factor_type}
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
