/**
 * Home page component
 * Main interface for the screenshot tool
 */
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <MainLayout>
      <div className="flex min-h-screen flex-col items-center justify-center p-24 space-y-6">
        <h1 className="text-4xl font-bold">Screenshot Tool</h1>
        <p className="text-muted-foreground">Capture, annotate, and share screenshots</p>
        <div className="space-x-4">
          <Button asChild>
            <Link href="/login">Get Started</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/projects">View Projects</Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
