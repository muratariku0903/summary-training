import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'
import { searchExercises, searchExercisesSchema } from '@/lib/features/exercise/server'
import { ExercisesTable } from './components/ExercisesTable'
import { Pagination } from '@/app/exercises/components/Pagination'
import { ExercisesSearchForm } from './components/ExercisesSearchForm'
import { Suspense } from 'react'
import Loading from '@/components/elements/loading/Loading'
import { withServerLogger } from '@/lib/log/serverComponentWrapper'

// 動的レンダリングを強制
export const dynamic = 'force-dynamic'

type SearchParams = { [key: string]: string | string[] | undefined }

export default async function ExercisesPage({
  searchParams,
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
  return withServerLogger(
    async (logger) => {
      logger.info('ExercisesContent rendering started', { params })

      const { success, data } = searchExercisesSchema.safeParse(params)
      if (!success) {
        logger.warn('Invalid search parameters', {
          params,
          validationError: 'Failed to parse search params',
        })
      }

      const { exercises, currentPage, totalPages } = await searchExercises(
        success ? data : { page: 1 },
      )

      logger.info('Exercises fetched successfully', {
        exercisesCount: exercises.length,
        currentPage,
        totalPages,
      })

      return (
        <div className='space-y-4'>
          <ExercisesTable data={exercises} />
          {totalPages > 0 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          )}
        </div>
      )
    },
    {
      component: ExercisesContent.name,
      searchParams: params,
    },
  )
}
