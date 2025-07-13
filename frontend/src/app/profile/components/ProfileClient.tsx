'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layouts/header/Header'
import Footer from '@/components/layouts/footer/Footer'
import Main from '@/components/layouts/main/Main'
import ConfirmDialog from '@/components/elements/confirm-dialog/ConfirmDialog'
import { PUBLIC_PATHS } from '@/lib/constants/routes'
import { UserProfile } from '@/lib/supabase/schema/utils'
import { request } from '@/lib/api/client'
import ProfileSideMenu, { MenuKey } from './ProfileSideMenu'

import { User } from '@supabase/supabase-js'
import ProfileBasicInfo from './ProfileBasicInfo'
import ProfileAccountInfo from './ProfileAccountInfo'

type ProfileClientProps = {
  user: User
  profile: UserProfile
}

export default function ProfileClient({ user, profile }: ProfileClientProps) {
  const router = useRouter()

  const [activeMenu, setActiveMenu] = useState<MenuKey>('basic')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // メインコンテンツの表示切り替え
  const renderMainContent = () => {
    switch (activeMenu) {
      case 'basic':
        return <ProfileBasicInfo profile={profile} />
      case 'account':
        return (
          <ProfileAccountInfo
            user={user}
            onClickDeleteAccount={() => setShowDeleteDialog(true)}
          />
        )
      default:
        return <ProfileBasicInfo profile={profile} />
    }
  }

  return (
    <>
      <Header menuType='member' />
      <Main>
        <div className='flex gap-6 py-6'>
          {/* サイドメニュー */}
          <ProfileSideMenu
            activeMenu={activeMenu}
            onMenuChange={(menu) => setActiveMenu(menu)}
          />

          {/* メインコンテンツ */}
          <div className='flex-1 bg-white border-2 border-black p-6'>
            {renderMainContent()}
          </div>
        </div>
      </Main>
      <Footer />

      {/* アカウント削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={async () => {
          const { success: delSuccess, error } = await request(
            '/user/delete',
            'delete',
            undefined,
            {
              requireAuth: true,
            }
          )
          // TODO: エラーの見せ方は要検討
          if (!delSuccess) {
            console.error(error.code)
            return
          }

          router.replace(PUBLIC_PATHS.HOME)
        }}
        title='アカウントを削除'
        message={`アカウントを削除すると、すべてのデータが完全に削除されます。\n\nこの操作は取り消すことができません。\n\n本当にアカウントを削除しますか？`}
        confirmLabel='削除する'
        cancelLabel='キャンセル'
        variant='danger'
      />
    </>
  )
}
