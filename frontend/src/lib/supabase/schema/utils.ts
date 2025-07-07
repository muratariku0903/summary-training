import { Database, Tables } from './schema'

export type UserProfile = Tables<'user_profiles'>
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
