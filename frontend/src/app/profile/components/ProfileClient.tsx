'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layouts/header/Header'
import Footer from '@/components/layouts/footer/Footer'
import Main from '@/components/layouts/main/Main'
import { HeaderMenuType } from '@/components/layouts/header/Header'
import ConfirmDialog from '@/components/elements/confirm-dialog/ConfirmDialog'
import { PUBLIC_PATHS } from '@/lib/constants/routes'
import { UserProfile } from '@/lib/supabase/schema/utils'
import { request } from '@/lib/api/client'
import ProfileSideMenu, { MenuKey } from './ProfileSideMenu'

import { User } from '@supabase/supabase-js'
import ProfileBasicInfo from './ProfileBasicInfo'

type ProfileClientProps = {
  user: User
  profile: UserProfile
}

export default function ProfileClient({ user, profile }: ProfileClientProps) {
  const router = useRouter()

  const [activeMenu, setActiveMenu] = useState<MenuKey>('basic')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // アカウント情報コンテンツ
  const AccountContent = () => (
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
          <div className='flex items-center justify-between p-3 border-2 border-black bg-gray-50'>
            <div>
              <span className='block'>TOTP認証</span>
              <span
                className={`text-sm ${
                  user.factors && user.factors.length ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {user.factors && user.factors.length > 0 ? '有効' : '無効'}
              </span>
            </div>
            <button className='px-3 py-1 text-sm border-2 border-black bg-white hover:bg-gray-100 transition-colors'>
              管理
            </button>
          </div>
        </div>
      </div>

      <div className='pt-6 border-t-2 border-gray-200'>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className='px-4 py-2 bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 transition-colors'
        >
          アカウントを削除
        </button>
      </div>
    </div>
  )

  // メインコンテンツの表示切り替え
  const renderMainContent = () => {
    switch (activeMenu) {
      case 'basic':
        return <ProfileBasicInfo profile={profile} />
      case 'account':
        return <AccountContent />
      default:
        return <ProfileBasicInfo profile={profile} />
    }
  }

  return (
    <>
      <Header menuType={HeaderMenuType.MEMBER} />
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
          setIsDeleting(true)
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

          setIsDeleting(false)
          router.replace(PUBLIC_PATHS.HOME)
        }}
        title='アカウントを削除'
        message={`アカウントを削除すると、すべてのデータが完全に削除されます。\n\nこの操作は取り消すことができません。\n\n本当にアカウントを削除しますか？`}
        confirmLabel='削除する'
        cancelLabel='キャンセル'
        confirmVariant='danger'
        isProcessing={isDeleting}
      />
    </>
  )
}
