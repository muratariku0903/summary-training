'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
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
import { updateProfileAction } from '@/lib/actions/profile/action'
import TextInput from '@/components/elements/text-input/TextInput'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateProfileSchema } from '@/lib/actions/profile/schema'
import TextArea from '@/components/elements/text-area/TextArea'

type ProfileClientProps = {
  user: User
  profile: UserProfile
}

export default function ProfileClient({ user, profile }: ProfileClientProps) {
  const router = useRouter()

  const [state, formAction, isPending] = useActionState(updateProfileAction, {
    status: 'none',
    data: profile,
  })
  const [transactioPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    formState: { errors },
    clearErrors,
  } = useForm({ resolver: zodResolver(updateProfileSchema) })

  const [isDeleting, setIsDeleting] = useState(false)

  const [activeMenu, setActiveMenu] = useState<MenuKey>('basic')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (state.status === 'success') {
      setSuccessMessage('プロフィールを編集しました')
    }
    if (state.status === 'error') {
      setError(state.error)
    }
  }, [state])

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
            {state.data.avatar_url ? (
              <Image
                src={state.data.avatar_url}
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
            <h1 className='text-2xl font-bold'>{state.data.display_name}</h1>
            <p className='text-gray-600'>ID: {state.data.id}</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit((data) => {
          startTransition(() => {
            formAction(data)
            setIsEditing(false)
          })
        })}
      >
        <div className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <TextInput
                labelText='ユーザー名'
                edit={isEditing}
                showValue={state.data.user_name}
                {...register('user_name')}
                defaultValue={state.data.user_name ?? ''}
                errorMessage={errors['user_name']?.message}
              />
            </div>

            <div className='space-y-2'>
              <TextInput
                labelText='表示名'
                edit={isEditing}
                showValue={state.data.display_name}
                {...register('display_name')}
                defaultValue={state.data.display_name ?? ''}
                errorMessage={errors['display_name']?.message}
              />
            </div>
            <div className='space-y-2'>
              <TextInput
                labelText='登録日'
                edit={false}
                showValue={formatDate(state.data.created_at)}
              />
            </div>
            <div className='space-y-2'>
              <TextInput
                labelText='最終更新'
                edit={false}
                showValue={formatDateTime(state.data.updated_at)}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <TextArea
              labelText='自己紹介'
              edit={isEditing}
              showValue={state.data.bio}
              {...register('bio')}
              defaultValue={state.data.bio || ''}
              className='w-full p-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black min-h-[100px]'
              placeholder='自己紹介を入力してください'
              rows={4}
              errorMessage={errors['bio']?.message}
            />
          </div>
          {/* 編集ボタン */}
          <div className='flex space-x-2'>
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setError(null)
                    clearErrors()
                  }}
                  disabled={isPending}
                  className='px-4 py-2 text-sm border-2 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50'
                >
                  キャンセル
                </button>
                <button
                  type='submit'
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
