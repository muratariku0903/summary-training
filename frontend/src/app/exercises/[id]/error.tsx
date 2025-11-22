'use client'

import Footer from '@/components/layouts/footer/Footer'
import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import { Button } from '@/components/ui/button'
import { PROTECTED_PATHS } from '@/lib/constants/routes'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

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
            データの読み込み中にエラーが発生しました!!!!
            <br />
            時間をおいて再度お試しください。
          </p>
          <div className='flex gap-2'>
            <Button
              onClick={() => router.push(PROTECTED_PATHS.EXERCISES)}
              variant='outline'
              className='gap-2'
            >
              <ArrowLeft className='h-4 w-4' />
              一覧に戻る
            </Button>
            <Button onClick={reset} variant='outline'>
              再試行
            </Button>
          </div>
        </div>
      </Main>
      <Footer />
    </>
  )
}
