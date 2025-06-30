'use client'

import ReversalLink from '@/components/elements/reversal-link/ReversalLink'
import { Spacer } from '@/components/elements/spacer/Spacer'
import UnderlineLink from '@/components/elements/underline-link/UnderlineLink'
import IconButton from '@/components/elements/icon-button/IconButton'
import { PUBLIC_PATHS } from '@/lib/constants/routes'
import { signOut } from '@/lib/supabase/auth/auth'
import { useRouter } from 'next/navigation'

// メニュータイプの定義
export enum HeaderMenuType {
  GUEST = 'guest', // 非会員
  MEMBER = 'member', // 会員
  HIDDEN = 'hidden', // メニュー非表示
}

type HeaderProps = {
  menuType?: HeaderMenuType
}

const Header: React.FC<HeaderProps> = ({ menuType = HeaderMenuType.GUEST }) => {
  const router = useRouter()

  // 設定メニューの処理（仮実装）
  const handleSettings = () => {
    console.log('設定画面へ')
  }

  // ユーザーメニューの設定
  const userMenuItems = [
    {
      label: '設定',
      onClick: handleSettings,
      icon: (
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
          />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
          />
        </svg>
      ),
    },
    {
      label: 'サインアウト',
      onClick: async () => {
        await signOut()
        router.replace(PUBLIC_PATHS.HOME)
      },
      icon: (
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
          />
        </svg>
      ),
    },
  ]

  // 非会員用メニュー
  const renderGuestMenu = () => (
    <div>
      <UnderlineLink label='使い方' href='#' />
      <Spacer size={8} horizontal />
      <UnderlineLink label='メリット' href='#' />
      <Spacer size={40} horizontal />
      <ReversalLink label='ログイン' href={PUBLIC_PATHS.SIGNIN} />
      <Spacer size={8} horizontal />
      <ReversalLink label='新規登録' href={PUBLIC_PATHS.SIGNUP} />
    </div>
  )

  // 会員用メニュー
  const renderMemberMenu = () => (
    <div className='flex items-center relative'>
      <UnderlineLink label='使い方' href='#' />
      <Spacer size={8} horizontal />
      <UnderlineLink label='メリット' href='#' />
      <Spacer size={40} horizontal />

      <IconButton
        label='ユーザー'
        size='md'
        menuItems={userMenuItems}
        menuAlignRight={true}
      />
    </div>
  )

  return (
    <header className='flex justify-between items-center p-8 text-black'>
      <div className='flex items-center'>
        <h1 className='ml-2 text-xl font-bold'>要約訓練</h1>
      </div>

      {menuType === HeaderMenuType.GUEST && renderGuestMenu()}
      {menuType === HeaderMenuType.MEMBER && renderMemberMenu()}
      {/* HeaderMenuType.HIDDEN の場合は何も表示しない */}
    </header>
  )
}

export default Header
