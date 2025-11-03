'use client'

import Footer from '@/components/layouts/footer/Footer'
import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

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
        <div className='w-full flex flex-col items-center justify-center p-8 space-y-4'>
          <div className='flex items-center gap-2 text-destructive'>
            <AlertCircle className='h-6 w-6' />
            <h2 className='text-lg font-semibold'>データの取得に失敗しました</h2>
          </div>
          <p className='text-sm text-muted-foreground text-center max-w-md'>
            データの読み込み中にエラーが発生しました。
            <br />
            時間をおいて再度お試しください。
          </p>
          <Button onClick={reset} variant='outline'>
            再試行
          </Button>
        </div>
      </Main>
      <Footer />
    </>
  )
}
