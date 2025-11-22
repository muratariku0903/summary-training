'use client'

import ErrorState from '@/components/elements/error-state/ErrorState'
import Footer from '@/components/layouts/footer/Footer'
import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <>
      <Header menuType='hidden' />
      <Main>
        <ErrorState resetAction={reset} />
      </Main>
      <Footer />
    </>
  )
}
