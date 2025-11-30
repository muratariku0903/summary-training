import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'
import { getUserProfile } from '@/lib/features/user/server'
import { adminClient } from '@/lib/supabase/client/adminClient'
import { updateDescopeUserEmail } from '@/lib/descope/utils'
import { convertMfaFactors } from '@/lib/supabase/auth/mfa'
import MfaSwitcher from '@/components/features/auth/MfaSwitcher'

// この画面はSupabaseからの確認メールのリンクを押下した際に遷移
export default async function EmailChangeCallbackPage() {
  // SSRでユーザー情報を取得
  const { user } = await getUserProfile()
  const newEmail = user.email

  if (!newEmail) {
    // TODO エラーページに遷移
    return <h1>error</h1>
  }

  const mfaFactors = convertMfaFactors({
    all: [],
    totp: user.factors?.filter((f) => f.factor_type === 'totp') ?? [],
    phone: user.factors?.filter((f) => f.factor_type === 'phone') ?? [],
  })

  // Descopeアカウントが紐づいてればそちらのメールアドレスも更新
  const descopeLoginId = user.app_metadata.descope_login_id as string | undefined
  if (descopeLoginId) {
    const { error: upErr } = await adminClient.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...user.app_metadata,
        descope_login_id: newEmail,
      },
    })
    if (upErr) {
      console.warn('ユーザーのメタデータの更新に失敗しました', upErr)
    }

    const { success, error } = await updateDescopeUserEmail(descopeLoginId, newEmail)
    if (!success) {
      console.warn('Descopeユーザーのメールアドレス変更に失敗しました', error)
    }
  }

  return (
    <>
      <Header menuType='member' />
      <Main>
        {/* MFAの設定があるユーザーはMFA設定実施 */}
        {mfaFactors.length > 0 && (
          <div style={{ maxWidth: 500, margin: '2rem auto', textAlign: 'center' }}>
            <h2>メールアドレスの変更が完了しました</h2>
            <p style={{ margin: '1.5rem 0', fontSize: '1.1rem', lineHeight: '1.6' }}>
              引き続きアプリをご利用する際は
              <br />
              再度MFA認証お願いします。
            </p>
            <MfaSwitcher
              initSelectedMFA={mfaFactors.length === 0 ? mfaFactors[0] : null}
              selectableMFAList={mfaFactors}
            />
          </div>
        )}
        {/* MFAの設定がないユーザーはそのまま完了通知 */}
        {mfaFactors.length === 0 && (
          <div style={{ maxWidth: 500, margin: '2rem auto', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2>メールアドレスの変更が完了しました</h2>
            <p style={{ margin: '1.5rem 0', fontSize: '1.1rem', lineHeight: '1.6' }}>
              新しいメールアドレスの確認が完了し、有効になりました。
            </p>
          </div>
        )}
      </Main>
      <Footer />
    </>
  )
}
