import { NextResponse } from 'next/server'
import { fetchWithTimeout } from '@/utils/website-utils'
import type { ApiResponse, UrlValidationResponse } from '@/types/api'

async function tryUrl(url: string): Promise<Response | null> {
  try {
    const response = await fetchWithTimeout(url)
    return response.ok ? response : null
  } catch (error) {
    return null
  }
}

async function findCanonicalDomain(url: string): Promise<string | null> {
  const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
  const variants = [
    `https://www.${urlObj.hostname}`,
    `https://${urlObj.hostname}`,
    `http://www.${urlObj.hostname}`,
    `http://${urlObj.hostname}`
  ]

  for (const variant of variants) {
    const response = await tryUrl(variant)
    if (response) {
      // Check if we were redirected
      const finalUrl = response.url
      return new URL(finalUrl).origin
    }
  }
  
  return null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    
    if (!url) {
      return NextResponse.json<ApiResponse<UrlValidationResponse>>({
        success: false,
        error: "URL parameter is required",
        data: {
          isValid: false,
          error: "Missing URL parameter"
        }
      })
    }

    const canonicalDomain = await findCanonicalDomain(url)
    if (canonicalDomain) {
      return NextResponse.json<ApiResponse<UrlValidationResponse>>({
        success: true,
        data: {
          isValid: true,
          normalizedUrl: canonicalDomain
        }
      })
    }

    return NextResponse.json<ApiResponse<UrlValidationResponse>>({
      success: false,
      error: "Website appears to be inaccessible",
      data: {
        isValid: false,
        error: "Could not access website"
      }
    })
  } catch (error) {
    return NextResponse.json<ApiResponse<UrlValidationResponse>>({
      success: false,
      error: "Failed to access the website",
      data: {
        isValid: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    })
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    
    const canonicalDomain = await findCanonicalDomain(url)
    if (canonicalDomain) {
      return NextResponse.json<ApiResponse<UrlValidationResponse>>({
        success: true,
        data: {
          isValid: true,
          normalizedUrl: canonicalDomain
        }
      })
    }

    return NextResponse.json<ApiResponse<UrlValidationResponse>>({
      success: false,
      error: "Website appears to be inaccessible",
      data: {
        isValid: false,
        error: "Could not access website"
      }
    })
  } catch (error) {
    return NextResponse.json<ApiResponse<UrlValidationResponse>>({
      success: false,
      error: "Failed to access the website",
      data: {
        isValid: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    })
  }
} 