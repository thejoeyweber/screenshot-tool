/**
 * Sitemap Service
 * 
 * Purpose: Handles sitemap fetching and parsing
 * Functionality: Fetches sitemaps, parses XML, extracts URLs
 * Relationships: Used by sitemap page and URL processing
 */

import { XMLParser } from 'fast-xml-parser'

export interface SitemapUrl {
  loc: string
  lastmod?: string
  priority?: number
  changefreq?: string
}

export interface SitemapData {
  urls: SitemapUrl[]
  error?: string
  errorType?: 'ACCESS_ERROR' | 'SITEMAP_NOT_FOUND' | 'PARSE_ERROR'
  resolvedDomain?: string
  availableSitemaps?: string[]
}

interface SitemapEntry {
  loc: string
  lastmod?: string
}

/**
 * Safe fetch that handles CORS and various response types
 */
async function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const defaultOptions: RequestInit = {
    mode: 'cors',
    credentials: 'omit',
    redirect: 'follow',
    headers: {
      'Accept': 'text/html,application/xml,application/xhtml+xml,text/xml;q=0.9',
      'User-Agent': 'Mozilla/5.0 (compatible; ScreenshotBot/1.0)'
    }
  }

  try {
    const response = await fetch(url, { ...defaultOptions, ...options })
    return response
  } catch (error) {
    // If CORS fails, we'll still consider the site accessible
    // The error just means we can't directly fetch from browser
    if (error instanceof TypeError && error.message.includes('CORS')) {
      return new Response(null, { status: 200 })
    }
    throw error
  }
}

/**
 * Attempts to resolve the correct domain with various prefixes
 */
async function resolveDomain(url: string): Promise<string> {
  // Normalize the URL
  let domain = url.toLowerCase().trim()
  if (!domain.startsWith('http')) {
    domain = 'https://' + domain
  }

  try {
    // Create URL object to validate and get origin
    const urlObj = new URL(domain)
    // For WordPress sites, we can assume they're accessible if the domain is valid
    return urlObj.origin
  } catch (error) {
    throw new Error('Invalid URL format. Please enter a valid website address.')
  }
}

/**
 * Attempts to find sitemap URLs from robots.txt
 * Never throws, always returns empty array on any error
 */
async function findSitemapsInRobots(domain: string): Promise<string[]> {
  try {
    const robotsUrl = new URL('/robots.txt', domain).href
    const response = await safeFetch(robotsUrl, {
      // Don't wait too long for robots.txt
      signal: AbortSignal.timeout(3000)
    })
    
    // Any failure just returns empty array
    if (!response.ok) return []
    
    const robotsText = await response.text()
    // Check if it looks like a robots.txt file
    if (!robotsText.includes('User-agent:')) return []

    const sitemapMatches = robotsText.match(/Sitemap:\s*(.+)/gi)
    
    if (sitemapMatches && sitemapMatches.length > 0) {
      return sitemapMatches
        .map(match => {
          try {
            const url = match.replace(/Sitemap:\s*/i, '').trim()
            // Validate it's a proper URL
            new URL(url)
            return url
          } catch {
            return ''
          }
        })
        .filter(url => url && url.endsWith('.xml'))
    }
  } catch (error) {
    // Log but don't throw
    console.warn('Error checking robots.txt (non-critical):', error)
  }
  
  return []
}

/**
 * Fetches XML content and validates it's a sitemap
 */
async function fetchAndValidateXml(url: string): Promise<{ content: string | null, hasUrls: boolean }> {
  try {
    console.log('Attempting to fetch:', url)
    const response = await safeFetch(url, {
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) {
      console.log('Response not OK for:', url, 'Status:', response.status)
      return { content: null, hasUrls: false }
    }
    
    const xmlText = await response.text()
    console.log('Fetched content length:', xmlText.length, 'for:', url)
    
    // Basic XML validation
    if (!xmlText.trim()) {
      console.log('Empty response for:', url)
      return { content: null, hasUrls: false }
    }
    
    // Check for common sitemap XML patterns
    const isSitemap = xmlText.includes('<?xml') && 
      (xmlText.includes('urlset') || xmlText.includes('sitemapindex'))
    
    if (!isSitemap) {
      console.log('Not a valid sitemap XML for:', url)
      return { content: null, hasUrls: false }
    }
    
    // Check if the sitemap actually contains URLs or sub-sitemaps
    const hasUrls = xmlText.includes('<loc>') && 
      (xmlText.includes('</url>') || xmlText.includes('</sitemap>'))
    
    console.log('Sitemap validation result for:', url, 'Has URLs:', hasUrls)
    
    return { 
      content: xmlText,
      hasUrls
    }
  } catch (error) {
    // More detailed error logging
    if (error instanceof Error) {
      console.warn('Error fetching sitemap:', url, 'Error:', error.name, error.message)
    } else {
      console.warn('Unknown error fetching sitemap:', url, error)
    }
    return { content: null, hasUrls: false }
  }
}

/**
 * Fetches and parses a sitemap from a given URL
 */
export async function fetchSitemap(url: string): Promise<SitemapData> {
  try {
    // First resolve the correct domain
    const resolvedDomain = await resolveDomain(url)
    console.log('Resolved domain:', resolvedDomain)
    
    // Common sitemap locations to try, ordered by commonality
    const commonLocations = [
      '/sitemap.xml',           // Most common standard location
      '/sitemap_index.xml',     // Common index location
      '/sitemapindex.xml',      // Alternative index name
      '/sitemap/sitemap.xml',   // Common subfolder location
      '/sitemap/index.xml',     // Alternative subfolder index
      '/sitemap-index.xml',     // Hyphenated variant
      // WordPress-specific locations
      '/wp-sitemap.xml',        // WP alternate
      '/post-sitemap.xml',      // WP posts
      '/page-sitemap.xml',      // WP pages
      '/category-sitemap.xml'   // WP categories
    ]
    
    // Try to get sitemap URLs from robots.txt, but don't wait too long
    let robotsSitemaps: string[] = []
    try {
      robotsSitemaps = await Promise.race([
        findSitemapsInRobots(resolvedDomain),
        new Promise<string[]>(resolve => setTimeout(() => resolve([]), 3000))
      ])
      console.log('Found sitemaps in robots.txt:', robotsSitemaps)
    } catch (error) {
      console.warn('Error checking robots.txt:', error)
      robotsSitemaps = []
    }

    // Keep track of all attempted URLs and found sitemaps
    const attemptedUrls = new Set<string>()
    const foundSitemaps: string[] = []
    
    // Function to try a sitemap URL
    async function trySitemapUrl(sitemapUrl: string): Promise<SitemapData | null> {
      if (attemptedUrls.has(sitemapUrl)) {
        console.log('Already attempted:', sitemapUrl)
        return null
      }
      
      console.log('Trying sitemap URL:', sitemapUrl)
      attemptedUrls.add(sitemapUrl)
      
      const { content, hasUrls } = await fetchAndValidateXml(sitemapUrl)
      if (content) {
        foundSitemaps.push(sitemapUrl)
        console.log('Found valid sitemap at:', sitemapUrl, 'Has URLs:', hasUrls)
        
        if (hasUrls) {
          const result = parseSitemapResponse(content, resolvedDomain)
          console.log('Parsed URLs count:', result.urls.length)
          
          if (result.urls.length > 0) {
            return {
              ...result,
              availableSitemaps: foundSitemaps
            }
          }
          
          if (result.availableSitemaps?.length) {
            console.log('Found sub-sitemaps:', result.availableSitemaps)
            // Try the first few sub-sitemaps from an index
            for (const subSitemapUrl of result.availableSitemaps.slice(0, 3)) {
              console.log('Trying sub-sitemap:', subSitemapUrl)
              const subResult = await trySitemapUrl(subSitemapUrl)
              if (subResult?.urls.length) {
                return {
                  ...subResult,
                  availableSitemaps: result.availableSitemaps
                }
              }
            }
          }
        }
      }
      return null
    }
    
    // Try all possible sitemap URLs
    const allSitemapUrls = [
      ...robotsSitemaps,
      ...commonLocations.map(path => new URL(path, resolvedDomain).href)
    ]
    
    console.log('Attempting sitemap URLs:', allSitemapUrls)
    
    for (const sitemapUrl of allSitemapUrls) {
      const result = await trySitemapUrl(sitemapUrl)
      if (result) {
        console.log('Successfully found sitemap with URLs:', sitemapUrl)
        return result
      }
    }

    // If we found sitemaps but no URLs, return that info
    if (foundSitemaps.length > 0) {
      console.log('Found sitemaps but no URLs:', foundSitemaps)
      return {
        urls: [],
        resolvedDomain,
        availableSitemaps: foundSitemaps,
        error: 'Found sitemaps but they contained no URLs. Try using a specific sitemap.',
        errorType: 'PARSE_ERROR'
      }
    }

    // No sitemaps found
    console.log('No sitemaps found at all')
    return {
      urls: [],
      resolvedDomain,
      error: 'Could not find any sitemap files. Try providing a direct sitemap URL.',
      errorType: 'SITEMAP_NOT_FOUND'
    }
  } catch (error) {
    console.error('Error in fetchSitemap:', error)
    return {
      urls: [],
      error: error instanceof Error ? error.message : 'Failed to access website',
      errorType: 'ACCESS_ERROR'
    }
  }
}

/**
 * Parses sitemap XML response
 */
function parseSitemapResponse(xmlText: string, resolvedDomain: string): SitemapData {
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
  })

  try {
    const result = parser.parse(xmlText)
    let urls: SitemapUrl[] = []
    
    if (result.urlset?.url) {
      // Standard sitemap
      urls = Array.isArray(result.urlset.url) 
        ? result.urlset.url 
        : [result.urlset.url]
    } else if (result.sitemapindex?.sitemap) {
      // Sitemap index
      const sitemaps: SitemapEntry[] = Array.isArray(result.sitemapindex.sitemap)
        ? result.sitemapindex.sitemap
        : [result.sitemapindex.sitemap]
      
      return {
        urls: [],
        resolvedDomain,
        availableSitemaps: sitemaps.map(s => s.loc).filter(Boolean),
        error: 'Multiple sitemaps available. Using first sitemap.',
        errorType: 'PARSE_ERROR'
      }
    }

    // Normalize URL objects
    urls = urls.map(url => ({
      loc: url.loc,
      lastmod: url.lastmod,
      priority: url.priority,
      changefreq: url.changefreq
    }))

    return { urls, resolvedDomain }
  } catch (error) {
    return {
      urls: [],
      resolvedDomain,
      error: 'Failed to parse sitemap XML',
      errorType: 'PARSE_ERROR'
    }
  }
}

/**
 * Organizes URLs into a tree structure
 */
export function organizeUrlTree(urls: SitemapUrl[]) {
  const tree: Record<string, SitemapUrl[]> = {}
  
  urls.forEach(url => {
    try {
      const urlObj = new URL(url.loc)
      const path = urlObj.pathname
      const section = path.split('/')[1] || 'root'
      
      if (!tree[section]) {
        tree[section] = []
      }
      tree[section].push(url)
    } catch (error) {
      console.error('Error parsing URL:', url.loc, error)
    }
  })
  
  return tree
} 