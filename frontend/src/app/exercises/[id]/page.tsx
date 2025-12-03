import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'
import { getExerciseWithSingedUrl } from '@/lib/features/exercise/server'
import { Exercise } from '../components/Exercise'
import { withServerLogger } from '@/lib/log/serverComponentWrapper'

// 動的レンダリングを強制
export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ExerciseDetailPage({ params }: PageProps) {
  const { id } = await params

  return withServerLogger(
    async (logger) => {
      logger.info('ExerciseDetailPage rendering started', { exerciseId: id })

      const { exercise, contentUrl } = await getExerciseWithSingedUrl(id)

      logger.info('Exercise detail fetched successfully', {
        exerciseId: exercise.id,
        hasContentUrl: !!contentUrl,
      })

      return (
        <>
          <Header menuType='member' />
          <Main>
            <Exercise exercise={exercise} contentUrl={contentUrl} />
          </Main>
          <Footer />
        </>
      )
    },
    {
      component: ExerciseDetailPage.name,
      exerciseId: id,
    },
  )
}
