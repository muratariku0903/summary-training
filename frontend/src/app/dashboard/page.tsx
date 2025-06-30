'use client'

import Header, { HeaderMenuType } from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'

export default function DashboardPage() {
  return (
    <>
      <Header menuType={HeaderMenuType.MEMBER} />
      <Main>
        <div style={{ maxWidth: 800, margin: '2rem auto', padding: '1rem' }}>
          <h1>ダッシュボード</h1>
          <h2>内容は検討中</h2>
        </div>
      </Main>
      <Footer />
    </>
  )
}
