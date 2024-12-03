/**
 * API Client Service
 * 
 * Purpose: Provides client-side methods for interacting with API endpoints
 * Functionality: Handles API requests, responses, and error handling
 */

import type { ApiResponse, UrlValidationResponse, SitemapResponse } from '@/types/api'

class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data: ApiResponse<T> = await response.json()
  
  if (!data.success) {
    throw new ApiError(data.error || 'Unknown error occurred')
  }
  
  return data.data as T
}

export async function validateUrl(url: string): Promise<UrlValidationResponse> {
  try {
    const response = await fetch('/api/validate-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    return handleResponse<UrlValidationResponse>(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('Failed to validate URL')
  }
}

export async function fetchSitemaps(url: string): Promise<SitemapResponse> {
  try {
    const response = await fetch('/api/fetch-sitemaps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    return handleResponse<SitemapResponse>(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('Failed to fetch sitemaps')
  }
} 