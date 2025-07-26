'use client'
import { AuthProvider } from '@descope/react-sdk'

export default function DescopeAuthProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider projectId={process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID!}>
      {children}
    </AuthProvider>
  )
}
