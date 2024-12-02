/**
 * Dashboard Layout
 * Shared layout for authenticated pages
 */
import { MainLayout } from '@/components/layout/MainLayout'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Add auth check and redirect if not authenticated
  // const isAuthenticated = await checkAuth()
  // if (!isAuthenticated) redirect('/login')

  return <MainLayout>{children}</MainLayout>
} 