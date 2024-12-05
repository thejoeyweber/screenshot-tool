import { NextResponse } from 'next/server'
import { fetchWithTimeout, extractSitemapsFromRobotsTxt } from '@/utils/website-utils'
import type { ApiResponse, SitemapResponse } from '@/types/api'

// Organize sitemaps by priority
const SITEMAP_LOCATIONS = {
  primary: [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/wp-sitemap.xml',
    '/sitemap-index.xml'
  ],
  
  secondary: [
    // WordPress common
    '/wp-sitemap-index.xml',
    '/post-sitemap.xml',
    '/page-sitemap.xml',
    
    // Other common CMS
    '/sitemaps/sitemap.xml',
    '/sitemap/sitemap.xml',
    '/_sitemap.xml',
    '/main-sitemap.xml'
  ],
  
  extended: [
    // WordPress extended
    '/wp-sitemap-posts-post-1.xml',
    '/category-sitemap.xml',
    
    // Shopify
    '/sitemap_products_1.xml',
    '/cdn/shop/sitemap.xml',
    
    // Wix
    '/sitemap_index.aspx',
    '/sitemap.aspx',
    
    // Squarespace
    '/sitemap.xml?page=1',
    
    // Drupal
    '/sitemap/sitemap.xml',
    
    // Joomla
    '/index.php?option=com_osmap&view=xml&format=xml',
    '/component/osmap/xml',
    '/sitemap/default.xml',
    
    // Magento
    '/pub/sitemap.xml',
    '/media/sitemap.xml',
    '/sitemap/category_0.xml',
    
    // Common variations
    '/sitemap/sitemap-index.xml',
    '/sitemap.php',
    '/sitemap/sitemap.php',
    '/sitemapindex.xml',
    '/sitemap/index.xml',
    '/sitemap_xml/sitemap.xml',
    '/sitemap-main.xml',
    '/root-sitemap.xml',
    '/site-sitemap.xml',
    
    // Language/regional
    '/en/sitemap.xml',
    '/en-us/sitemap.xml',
    '/eng/sitemap.xml',
    
    // Dynamic
    '/sitemap/generate.xml',
    '/dynamic-sitemap.xml',
    '/sitemap/cached.xml',
    
    // Alternative formats
    '/sitemap.gz',
    '/sitemap.txt',
    '/urllist.txt'
  ]
}

export async function POST(request: Request) {
  try {
    const { url, mode = 'primary' } = await request.json()
    const sitemapUrls = new Set<string>()
    
    // Try robots.txt first
    try {
      const robotsUrl = new URL('/robots.txt', url).toString()
      console.log('Checking robots.txt:', robotsUrl)
      const robotsResponse = await fetchWithTimeout(robotsUrl)
      
      if (robotsResponse.ok) {
        const robotsTxt = await robotsResponse.text()
        const robotsSitemaps = extractSitemapsFromRobotsTxt(robotsTxt)
        robotsSitemaps.forEach(url => sitemapUrls.add(url))
        console.log('Found in robots.txt:', robotsSitemaps)
      }
    } catch (error) {
      console.log('robots.txt not accessible, continuing with common locations')
    }

    // Determine which locations to check based on mode
    let locationsToCheck: string[] = []
    if (mode === 'primary') {
      locationsToCheck = SITEMAP_LOCATIONS.primary
    } else if (mode === 'secondary') {
      locationsToCheck = [...SITEMAP_LOCATIONS.primary, ...SITEMAP_LOCATIONS.secondary]
    } else if (mode === 'extended') {
      locationsToCheck = [
        ...SITEMAP_LOCATIONS.primary,
        ...SITEMAP_LOCATIONS.secondary,
        ...SITEMAP_LOCATIONS.extended
      ]
    }

    console.log(`Checking ${mode} sitemap locations`)
    for (const path of locationsToCheck) {
      try {
        const sitemapUrl = new URL(path, url).toString()
        console.log('Trying:', sitemapUrl)
        const response = await fetchWithTimeout(sitemapUrl)
        
        if (response.ok) {
          const contentType = response.headers.get('content-type')
          // Check if it's XML and contains sitemap content
          if (contentType?.includes('xml')) {
            const text = await response.text()
            if (text.includes('<urlset') || text.includes('<sitemapindex')) {
              sitemapUrls.add(sitemapUrl)
              console.log('Found valid sitemap:', sitemapUrl)
            }
          }
        }
      } catch (error) {
        // Continue checking other locations
        continue
      }
    }

    const uniqueSitemaps = Array.from(sitemapUrls)
    console.log('All found sitemaps:', uniqueSitemaps)

    return NextResponse.json<ApiResponse<SitemapResponse>>({
      success: true,
      data: {
        sitemapUrls: uniqueSitemaps,
        mode, // Return the mode used
        hasMoreOptions: mode === 'primary' || mode === 'secondary' // Indicate if more options are available
      }
    })
  } catch (error) {
    console.error('Sitemap discovery error:', error)
    return NextResponse.json<ApiResponse<SitemapResponse>>({
      success: false,
      error: "Failed to discover sitemaps",
      data: {
        sitemapUrls: [],
        error: error instanceof Error ? error.message : "Unknown error"
      }
    })
  }
} 