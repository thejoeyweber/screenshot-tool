import { NextResponse } from 'next/server'
import { fetchWithTimeout, extractSitemapsFromRobotsTxt, extractUrlsFromSitemap } from '@/utils/website-utils'
import type { ApiResponse, SitemapResponse } from '@/types/api'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    
    // First try robots.txt directly
    const robotsUrl = new URL('/robots.txt', url).toString()
    const robotsResponse = await fetchWithTimeout(robotsUrl)
    
    if (!robotsResponse.ok) {
      return NextResponse.json<ApiResponse<SitemapResponse>>({
        success: false,
        error: "Could not access robots.txt",
        data: {
          sitemapUrls: [],
          error: "Could not access robots.txt"
        }
      })
    }

    const robotsTxt = await robotsResponse.text()
    const sitemapUrls = extractSitemapsFromRobotsTxt(robotsTxt)

    // If no sitemaps in robots.txt, try common locations
    if (sitemapUrls.length === 0) {
      const commonSitemaps = [
        new URL('/sitemap.xml', url).toString(),
        new URL('/sitemap_index.xml', url).toString(),
        new URL('/sitemap.php', url).toString(),
      ]

      for (const sitemapUrl of commonSitemaps) {
        try {
          const response = await fetchWithTimeout(sitemapUrl)
          if (response.ok) {
            sitemapUrls.push(sitemapUrl)
          }
        } catch (error) {
          // Continue checking other locations
          continue
        }
      }
    }

    return NextResponse.json<ApiResponse<SitemapResponse>>({
      success: true,
      data: {
        sitemapUrls,
        robotsTxtContent: robotsTxt
      }
    })
  } catch (error) {
    return NextResponse.json<ApiResponse<SitemapResponse>>({
      success: false,
      error: "Failed to fetch sitemaps",
      data: {
        sitemapUrls: [],
        error: error instanceof Error ? error.message : "Unknown error"
      }
    })
  }
} 