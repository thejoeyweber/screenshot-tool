/**
 * Main layout component
 * Arranges header, sidebar, content, and footer
 */
import { Header } from './Header'
import { Footer } from './Footer'
import { Sidebar } from './Sidebar'
import { BaseProps } from '@/types'

export function MainLayout({ children }: BaseProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <Sidebar className="w-64 border-r" />
        <main className="flex-1">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
} 