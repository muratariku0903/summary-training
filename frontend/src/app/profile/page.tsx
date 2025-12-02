import ProfileClient from './components/ProfileClient'
import { getUserProfile } from '../../lib/features/user/server'
import { withServerLogger } from '@/lib/log/serverComponentWrapper'

export default async function ProfilePage() {
  return withServerLogger(
    async (logger) => {
      logger.info('ProfilePage rendering started')

      // SSRでユーザー情報を取得
      const { user, profile } = await getUserProfile()

      logger.info('User profile fetched successfully', {
        userId: user.id,
        hasProfile: !!profile,
      })

      return <ProfileClient user={user} profile={profile} />
    },
    {
      component: ProfilePage.name,
    },
  )
}
