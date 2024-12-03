/**
 * Root layout component that wraps all pages
 * Includes global providers, styles, and metadata
 */
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SidebarProvider } from '@/components/ui/sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Screenshot Tool',
  description: 'Capture and organize website screenshots',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
