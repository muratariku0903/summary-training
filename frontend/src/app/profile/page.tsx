'use client'

import { useState } from 'react'
import Header from '@/components/layouts/header/Header'
import Footer from '@/components/layouts/footer/Footer'
import Main from '@/components/layouts/main/Main'
import { HeaderMenuType } from '@/components/layouts/header/Header'
import { AccountIcon, ProfileIcon } from '@/components/icons/icons'
import ConfirmDialog from '@/components/elements/confirm-dialog/ConfirmDialog'
import { request } from '@/lib/api/client'
import { signOut } from '@/lib/supabase/auth/auth'
import { useRouter } from 'next/navigation'
import { PUBLIC_PATHS } from '@/lib/constants/routes'

// メニューアイテムの型定義
type MenuKey = 'basic' | 'account'

interface MenuItem {
  key: MenuKey
  label: string
  icon: React.ReactNode
}

export default function ProfilePage() {
  const router = useRouter()

  const [activeMenu, setActiveMenu] = useState<MenuKey>('basic')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // サイドメニューの設定
  const menuItems: MenuItem[] = [
    {
      key: 'basic',
      label: '基本情報',
      icon: <ProfileIcon />,
    },
    {
      key: 'account',
      label: 'アカウント',
      icon: <AccountIcon />,
    },
  ]

  // サイドメニューコンポーネント
  const SideMenu = () => (
    <div className='w-64 bg-white border-2 border-black p-4'>
      <h2 className='text-lg font-semibold mb-4 text-center'>プロフィール設定</h2>
      <nav>
        <ul className='space-y-2'>
          {menuItems.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => setActiveMenu(item.key)}
                className={`
                  w-full 
                  flex 
                  items-center 
                  px-4 
                  py-3 
                  text-left 
                  border-2 
                  transition-colors 
                  duration-200
                  ${
                    activeMenu === item.key
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-black hover:bg-gray-100'
                  }
                `}
              >
                <span className='mr-3'>{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )

  // 基本情報コンテンツ
  const BasicInfoContent = () => (
    <div className='space-y-6'>
      <div className='flex items-center space-x-4 mb-8'>
        {/* プロフィール画像 */}
        <div className='w-20 h-20 bg-gray-300 border-2 border-black flex items-center justify-center'>
          <svg
            className='w-12 h-12 text-gray-600'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
              clipRule='evenodd'
            />
          </svg>
        </div>
        <div>
          <h1 className='text-2xl font-bold'>ユーザー名</h1>
          <p className='text-gray-600'>ID: user123456</p>
        </div>
      </div>

      <div className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700'>ユーザー名</label>
            <div className='p-3 border-2 border-black bg-gray-50'>
              <span>サンプルユーザー</span>
            </div>
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700'>表示名</label>
            <div className='p-3 border-2 border-black bg-gray-50'>
              <span>Sample User</span>
            </div>
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700'>登録日</label>
            <div className='p-3 border-2 border-black bg-gray-50'>
              <span>2024年1月1日</span>
            </div>
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700'>
              最終ログイン
            </label>
            <div className='p-3 border-2 border-black bg-gray-50'>
              <span>2024年6月30日 14:30</span>
            </div>
          </div>
        </div>

        <div className='space-y-2'>
          <label className='block text-sm font-medium text-gray-700'>自己紹介</label>
          <div className='p-3 border-2 border-black bg-gray-50 min-h-[100px]'>
            <span className='text-gray-500'>自己紹介を入力してください</span>
          </div>
        </div>
      </div>
    </div>
  )

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
            <span>user@example.com</span>
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
              <span className='text-sm text-green-600'>有効</span>
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
        return <BasicInfoContent />
      case 'account':
        return <AccountContent />
      default:
        return <BasicInfoContent />
    }
  }

  return (
    <>
      <Header menuType={HeaderMenuType.MEMBER} />
      <Main>
        <div className='flex gap-6 py-6'>
          {/* サイドメニュー */}
          <SideMenu />

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

          //　退会処理をしてもブラウザに認証情報が残ってるので削除するためにサインアウト
          const { success: signOutSuccess, message } = await signOut()
          if (!signOutSuccess) {
            console.error(message)
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
