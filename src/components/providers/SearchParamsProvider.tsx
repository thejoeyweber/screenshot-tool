/**
 * SearchParamsProvider Component
 * Wraps useSearchParams in a Suspense boundary for Next.js compatibility
 */
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface SearchParamsProviderProps {
  children: (searchParams: ReturnType<typeof useSearchParams>) => React.ReactNode
}

function SearchParamsContent({ children }: SearchParamsProviderProps) {
  const searchParams = useSearchParams()
  return <>{children(searchParams)}</>
}

export function SearchParamsProvider({ children }: SearchParamsProviderProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsContent>{children}</SearchParamsContent>
    </Suspense>
  )
} 