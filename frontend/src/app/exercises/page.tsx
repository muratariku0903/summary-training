import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'
import { searchExercises } from '@/lib/features/exercise'
import { ExercisesTable } from './components/ExercisesTable'
import { Pagination } from '@/components/elements/pagination/Pagination'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const { exercises, currentPage, totalPages } = await searchExercises({ page })

  return (
    <>
      <Header menuType='member' />
      <Main>
        <div style={{ maxWidth: 1200, margin: '2rem auto', padding: '1rem' }}>
          <h1 className='text-2xl font-bold mb-6'>課題一覧</h1>
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
