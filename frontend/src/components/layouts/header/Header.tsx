'use client'

import ReversalLink from '@/components/elements/reversal-link/ReversalLink'
import { Spacer } from '@/components/elements/spacer/Spacer'
import UnderlineLink from '@/components/elements/underline-link/UnderlineLink'
import IconButton from '@/components/elements/icon-button/IconButton'
import { PROTECTED_PATHS, PUBLIC_PATHS } from '@/lib/constants/routes'
import { signOut } from '@/lib/supabase/auth/auth'
import { useRouter } from 'next/navigation'
import { SettingsIcon, SignOutIcon } from '@/components/icons/icons'
import Link from 'next/link'
import { useSnackbarStore } from '@/stores/useSnackbarStore'
import { UI_MESSAGES } from '@/lib/constants/ui'

type HeaderProps = {
  menuType?: 'guest' | 'member' | 'hidden'
}

const Header: React.FC<HeaderProps> = ({ menuType }) => {
  const router = useRouter()
  const showSnackbar = useSnackbarStore((s) => s.show)

  // ユーザーメニューの設定
  const userMenuItems = [
    {
      label: '設定',
      onClick: () => router.replace(PROTECTED_PATHS.PROFILE),
      icon: <SettingsIcon />,
    },
    {
      label: 'サインアウト',
      onClick: async () => {
        const { message } = await signOut()
        showSnackbar(UI_MESSAGES.SIGNOUT_SUCCESS_MESSAGE, 'success')
        console.log('signout error: ', message)

        console.log('before router')
        // router.replace(PUBLIC_PATHS.HOME)
        router.replace(PUBLIC_PATHS.HOME)

        console.log('after router')
      },
      icon: <SignOutIcon />,
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
        <Link href={PUBLIC_PATHS.HOME} aria-label='ホームへ'>
          <h1 className='ml-2 text-xl font-bold'>要約訓練</h1>
        </Link>
      </div>

      {menuType === 'guest' && renderGuestMenu()}
      {menuType === 'member' && renderMemberMenu()}
      {/* HeaderMenuType.HIDDEN の場合は何も表示しない */}
    </header>
  )
}

export default Header
