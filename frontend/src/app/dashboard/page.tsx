'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { browserClient as supabaseBrowserClient } from '@/lib/supabase/browserClient'
import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'
import type { User } from '@supabase/supabase-js'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mfaEnabled, setMfaEnabled] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // セッション確認
        const {
          data: { session },
          error,
        } = await supabaseBrowserClient.auth.getSession()
        console.log('session:', session)

        if (error || !session) {
          // 未ログインの場合はログイン画面にリダイレクト
          router.replace('/auth/signin')
          return
        }

        setUser(session.user)

        // MFA設定状況を確認
        const { data: factors } = await supabaseBrowserClient.auth.mfa.listFactors()
        const hasVerifiedFactor = factors?.all.some(
          (factor) => factor.status === 'verified'
        )
        setMfaEnabled(!!hasVerifiedFactor)
      } catch (error) {
        console.error('Auth check error:', error)
        router.replace('/auth/signin')
      } finally {
        setLoading(true)
      }
    }

    checkAuth()

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabaseBrowserClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/auth/signin')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    try {
      await supabaseBrowserClient.auth.signOut()
      router.replace('/auth/signin')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <>
        <Header enableMenu={false} />
        <Main>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>読み込み中...</p>
          </div>
        </Main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header enableMenu={true} />
      <Main>
        <div style={{ maxWidth: 800, margin: '2rem auto', padding: '1rem' }}>
          <h1>ダッシュボード</h1>

          {/* ユーザー情報 */}
          <div
            style={{
              background: '#f5f5f5',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '2rem',
            }}
          >
            <h2>アカウント情報</h2>
            <p>
              <strong>メールアドレス:</strong> {user?.email}
            </p>
            <p>
              <strong>登録日:</strong>{' '}
              {new Date(user?.created_at || '').toLocaleDateString('ja-JP')}
            </p>
            <p>
              <strong>MFA:</strong> {mfaEnabled ? '✅ 有効' : '❌ 無効'}
            </p>
          </div>

          {/* MFA設定セクション */}
          <div
            style={{
              background: mfaEnabled ? '#e8f5e8' : '#fff3cd',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '2rem',
            }}
          >
            <h2>セキュリティ設定</h2>
            {mfaEnabled ? (
              <div>
                <p>✅ 多要素認証が設定されています</p>
                <p>あなたのアカウントはTOTP認証で保護されています。</p>
              </div>
            ) : (
              <div>
                <p>⚠️ 多要素認証が設定されていません</p>
                <p>セキュリティ向上のため、MFAの設定をお勧めします。</p>
                <button
                  onClick={() => router.push('/auth/mfa/setup')}
                  style={{
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '1rem',
                  }}
                >
                  MFAを設定する
                </button>
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleSignOut}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              ログアウト
            </button>
          </div>
        </div>
      </Main>
      <Footer />
    </>
  )
}
