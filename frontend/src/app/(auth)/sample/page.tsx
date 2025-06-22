'use client'

import Header from '@/components/layouts/header/Header'
import Footer from '@/components/layouts/footer/Footer'
import Main from '@/components/layouts/main/Main'

export default function SamplePage() {
  return (
    <>
      <Header enableMenu={false} />
      <Main>
        <div className='flex justify-center py-4'>
          <div className='w-full max-w-sm bg-white p-6 border-2 border-black text-center'>
            <h1 className='text-2xl font-semibold mb-4'>サンプル</h1>
          </div>
        </div>
      </Main>
      <Footer />
    </>
  )
}
