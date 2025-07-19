'use client'

import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'

// この画面はSupabaseからの確認メールのリンクを押下した際に遷移
export default function EmailChangeCallbackPage() {
  return (
    <>
      <Header menuType='member' />
      <Main>
        <div style={{ maxWidth: 500, margin: '2rem auto', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2>メールアドレスの変更が完了しました</h2>
          <p style={{ margin: '1.5rem 0', fontSize: '1.1rem', lineHeight: '1.6' }}>
            新しいメールアドレスの確認が完了し、有効になりました。
          </p>
        </div>
      </Main>
      <Footer />
    </>
  )
}
