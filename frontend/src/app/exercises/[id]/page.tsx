import Header from '@/components/layouts/header/Header'
import Main from '@/components/layouts/main/Main'
import Footer from '@/components/layouts/footer/Footer'
import { getExercise } from '@/lib/features/exercise'
import { Exercise } from '../components/Exercise'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ExerciseDetailPage({ params }: PageProps) {
  const { id } = await params

  const { exercise, contentUrl } = await getExercise(id)

  return (
    <>
      <Header menuType='member' />
      <Main>
        <Exercise exercise={exercise} contentUrl={contentUrl} />
      </Main>
      <Footer />
    </>
  )
}
