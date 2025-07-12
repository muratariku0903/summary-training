import TwoFactorAuthenticationSetting from '../components/TwoFactorAuthenticationSetting'
import { getUserProfile } from '../../../lib/features/user'

export default async function ProfilePage() {
  // SSRでユーザー情報を取得
  const { user } = await getUserProfile()

  return <TwoFactorAuthenticationSetting user={user} />
}
