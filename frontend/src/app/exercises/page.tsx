import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'
import { searchExercises, searchExercisesSchema } from '@/lib/features/exercise'
import { ExercisesTable } from './components/ExercisesTable'
import { Pagination } from '@/app/exercises/components/Pagination'
import { ExercisesSearchForm } from './components/ExercisesSearchForm'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function ExercisesPage({
  searchParams, // <- Next.jsが自動的に注入
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const { success, data } = searchExercisesSchema.safeParse(params)

  const { exercises, currentPage, totalPages } = await searchExercises(
    success ? data : { page: 1 },
  )

  return (
    <>
      <Header menuType='member' />
      <Main>
        <div className='w-full'>
          <ExercisesSearchForm />
          <div className='space-y-4'>
            <ExercisesTable data={exercises} />
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        </div>
      </Main>
      <Footer />
    </>
  )
}
