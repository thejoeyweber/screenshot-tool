/**
 * Root layout component that wraps all pages
 * Includes global providers, styles, and metadata
 */
import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { inter, jetbrainsMono } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'Screenshot Tool',
  description: 'A powerful screenshot and annotation tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
