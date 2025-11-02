import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'
import { searchExercises, searchExercisesSchema } from '@/lib/features/exercise'
import { ExercisesTable } from './components/ExercisesTable'
import { Pagination } from '@/app/exercises/components/Pagination'
import { ExercisesSearchForm } from './components/ExercisesSearchForm'
import { Suspense } from 'react'
import Loading from '@/components/elements/loading/Loading'

type SearchParams = { [key: string]: string | string[] | undefined }

export default async function ExercisesPage({
  searchParams, // <- Next.jsが自動的に注入
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  return (
    <>
      <Header menuType='member' />
      <Main>
        <div className='w-full'>
          <ExercisesSearchForm />
          <Suspense key={JSON.stringify(params)} fallback={<Loading />}>
            <ExercisesContent params={params} />
          </Suspense>
        </div>
      </Main>
      <Footer />
    </>
  )
}

async function ExercisesContent({ params }: { params: SearchParams }) {
  const { success, data } = searchExercisesSchema.safeParse(params)

  const { exercises, currentPage, totalPages } = await searchExercises(
    success ? data : { page: 1 },
  )

  return (
    <div className='space-y-4'>
      <ExercisesTable data={exercises} />
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  )
}
