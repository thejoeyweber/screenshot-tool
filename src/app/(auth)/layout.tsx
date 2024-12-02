/**
 * Auth Layout
 * Shared layout for authentication pages
 */
import { redirect } from 'next/navigation'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Add auth check and redirect if already authenticated
  // const isAuthenticated = await checkAuth()
  // if (isAuthenticated) redirect('/dashboard')

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        {children}
      </div>
    </div>
  )
} 