'use client'

import { startTransition, useState } from 'react'
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
import { useSnackbarStore } from '@/stores/useSnackbarStore'
import { UI_MESSAGES } from '@/lib/constants/ui'
import { SENDING_PATTERN } from '@/lib/constants/email'
import { AuthProviders } from '@/lib/supabase/auth/types'
import { deleteOAuthAction } from '@/lib/actions/auth/oauth/delete/action'

type ProfileClientProps = {
  user: User
  profile: UserProfile
}

export default function ProfileClient({ user, profile }: ProfileClientProps) {
  const router = useRouter()

  const [activeMenu, setActiveMenu] = useState<MenuKey>('basic')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showOAuthUnlinkDialog, setShowOAuthUnlinkDialog] = useState<{
    show: boolean
    provider: AuthProviders | null
  }>({ show: false, provider: null })
  const showSnackbar = useSnackbarStore((s) => s.show)

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
            onClickOAuthUnlink={(provider: AuthProviders) =>
              setShowOAuthUnlinkDialog({ show: true, provider })
            }
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
            },
          )
          // TODO: エラーの見せ方は要検討
          if (!delSuccess) {
            console.error(error.code)
            return
          }

          if (user.email) {
            const sendingParams = {
              pattern: SENDING_PATTERN.ACCOUNT_DELETE_NOTIFICATION,
              emailTo: user.email,
            }
            const { error: sendingError } = await request(
              '/email/anon-post',
              'post',
              sendingParams,
            )
            if (sendingError) {
              console.warn('Fail sending email', sendingError)
            }
          }

          setShowDeleteDialog(false)
          showSnackbar(UI_MESSAGES.ACCOUNT_DELETE_SUCCESS_MESSAGE, 'success')

          // スナックバーを見せるため少し待ってから遷移
          setTimeout(() => {
            // router.replaceを使わないのは、Vercel環境のGoogleアカウント退会時に正しく遷移されず、対策として強制的に遷移させることにした
            window.location.href = PUBLIC_PATHS.HOME
          }, 1500)
        }}
        title='アカウントを削除'
        message={`アカウントを削除すると、すべてのデータが完全に削除されます。\n\nこの操作は取り消すことができません。\n\n本当にアカウントを削除しますか？`}
        confirmLabel='削除する'
        cancelLabel='キャンセル'
        variant='danger'
      />
      {/* OAuth接続解除認ダイアログ */}
      <ConfirmDialog
        isOpen={showOAuthUnlinkDialog.show}
        onClose={() => setShowOAuthUnlinkDialog({ show: false, provider: null })}
        onConfirm={async () => {
          startTransition(async () => {
            if (showOAuthUnlinkDialog.provider) {
              const provider = showOAuthUnlinkDialog.provider
              const { success, error } = await deleteOAuthAction({ provider })
              if (!success) {
                console.warn('error unlinking OAuth', error)

                return
              }

              setShowOAuthUnlinkDialog({ show: false, provider: null })
              router.refresh()
              showSnackbar(`${provider}の接続を解除しました`, 'success')
            }
          })
        }}
        title='接続解除'
        message={`本当に接続を解除しますか？`}
        confirmLabel='削除する'
        cancelLabel='キャンセル'
        variant='danger'
      />
    </>
  )
}
