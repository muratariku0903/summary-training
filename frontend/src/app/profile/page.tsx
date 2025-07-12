import ProfileClient from './components/ProfileClient'
import { getUserProfile } from '../../lib/features/user'

export default async function ProfilePage() {
  // SSRでユーザー情報を取得
  const { user, profile } = await getUserProfile()

  return <ProfileClient user={user} profile={profile} />
}
