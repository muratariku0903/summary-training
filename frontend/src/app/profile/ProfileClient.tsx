'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Header from '@/components/layouts/header/Header'
import Footer from '@/components/layouts/footer/Footer'
import Main from '@/components/layouts/main/Main'
import { HeaderMenuType } from '@/components/layouts/header/Header'
import ConfirmDialog from '@/components/elements/confirm-dialog/ConfirmDialog'
import { PUBLIC_PATHS } from '@/lib/constants/routes'
import { UserProfile } from '@/lib/supabase/schema/utils'
import { request } from '@/lib/api/client'
import ProfileSideMenu, { MenuKey } from './ProfileSideMenu'

import { formatDate, formatDateTime } from '@/utils/date'
import { User } from '@supabase/supabase-js'
import { updateProfile } from '@/lib/actions/profile'

type ProfileClientProps = {
  user: User
  profile: UserProfile
}

export default function ProfileClient({ user, profile }: ProfileClientProps) {
  const router = useRouter()
  const [profileData, setProfileData] = useState(profile)

  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const [activeMenu, setActiveMenu] = useState<MenuKey>('basic')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // 基本情報コンテンツ
  const BasicInfoContent = () => (
    <div className='space-y-6'>
      {/* エラーメッセージ */}
      {error && (
        <div className='p-4 bg-red-100 border-2 border-red-500 text-red-700 rounded'>
          <button
            onClick={() => setError(null)}
            className='float-right text-red-500 hover:text-red-700'
          >
            ×
          </button>
          {error}
        </div>
      )}

      {/* 成功メッセージ */}
      {successMessage && (
        <div className='p-4 bg-green-100 border-2 border-green-500 text-green-700 rounded'>
          <button
            onClick={() => setSuccessMessage(null)}
            className='float-right text-green-500 hover:text-green-700'
          >
            ×
          </button>
          {successMessage}
        </div>
      )}

      <div className='flex items-center justify-between mb-6 gap-6'>
        <div className='flex items-center space-x-4'>
          {/* プロフィール画像 */}
          <div className='w-20 h-20 bg-gray-300 border-2 border-black flex items-center justify-center'>
            {profileData.avatar_url ? (
              <Image
                src={profileData.avatar_url}
                alt='プロフィール画像'
                className='w-full h-full object-cover'
                priority={false}
              />
            ) : (
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
            )}
          </div>
          <div>
            <h1 className='text-2xl font-bold'>{profileData.display_name}</h1>
            <p className='text-gray-600'>ID: {profileData.id}</p>
          </div>
        </div>

        {/* 編集ボタン */}
        <div className='flex space-x-2'>
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setError(null)
                }}
                disabled={isPending}
                className='px-4 py-2 text-sm border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50'
              >
                キャンセル
              </button>
              <button
                type='submit'
                form='profile-form'
                disabled={isPending}
                className='px-4 py-2 text-sm border-2 border-black bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50'
              >
                {isPending ? '保存中...' : '保存'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className='px-4 py-2 text-sm border-2 border-black bg-white hover:bg-gray-100 transition-colors'
            >
              編集
            </button>
          )}
        </div>
      </div>

      <form
        id='profile-form'
        action={async (formData: FormData) => {
          setError(null)
          setSuccessMessage(null)

          console.log('formData:', formData)

          startTransition(async () => {
            const result = await updateProfile(formData)

            if (result.success && result.data) {
              setProfileData(result.data)
              setIsEditing(false)
              setSuccessMessage('プロフィールを更新しました')
              // 成功メッセージを3秒後に消去
              setTimeout(() => setSuccessMessage(null), 3000)
            } else {
              setError(result.error || 'プロフィールの更新に失敗しました')
            }
          })
        }}
      >
        <div className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <label className='block text-sm font-medium text-gray-700'>
                ユーザー名
              </label>
              {isEditing ? (
                <input
                  type='text'
                  name='user_name'
                  defaultValue={profileData.user_name ?? ''}
                  className='w-full p-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black'
                  required
                />
              ) : (
                <div className='p-3 border-2 border-black bg-gray-50'>
                  <span>{profileData.user_name}</span>
                </div>
              )}
            </div>

            <div className='space-y-2'>
              <label className='block text-sm font-medium text-gray-700'>表示名</label>
              {isEditing ? (
                <input
                  type='text'
                  name='display_name'
                  defaultValue={profileData.display_name ?? ''}
                  className='w-full p-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black'
                  required
                />
              ) : (
                <div className='p-3 border-2 border-black bg-gray-50'>
                  <span>{profileData.display_name}</span>
                </div>
              )}
            </div>

            <div className='space-y-2'>
              <label className='block text-sm font-medium text-gray-700'>登録日</label>
              <div className='p-3 border-2 border-black bg-gray-50'>
                <span>{formatDate(profileData.created_at)}</span>
              </div>
            </div>

            <div className='space-y-2'>
              <label className='block text-sm font-medium text-gray-700'>最終更新</label>
              <div className='p-3 border-2 border-black bg-gray-50'>
                <span>{formatDateTime(profileData.updated_at)}</span>
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-700'>自己紹介</label>
            {isEditing ? (
              <textarea
                name='bio'
                defaultValue={profileData.bio || ''}
                className='w-full p-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black min-h-[100px]'
                placeholder='自己紹介を入力してください'
                rows={4}
              />
            ) : (
              <div className='p-3 border-2 border-black bg-gray-50 min-h-[100px]'>
                <span className={profileData.bio ? 'text-black' : 'text-gray-500'}>
                  {profileData.bio || '自己紹介を入力してください'}
                </span>
              </div>
            )}
          </div>
        </div>
      </form>
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
