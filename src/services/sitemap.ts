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
  urlsBySource?: Record<string, SitemapUrl[]>
}

interface SitemapEntry {
  loc: string
  lastmod?: string
}

/**
 * Attempts to resolve the correct domain with various prefixes
 */
async function resolveDomain(url: string): Promise<string> {
  // Normalize the URL
  let domain = url.toLowerCase().trim()
  
  try {
    // Validate and get canonical domain
    const response = await fetch(`/api/validate-url?url=${encodeURIComponent(domain)}`)
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data.normalizedUrl) {
        console.debug('Successfully resolved canonical domain:', data.data.normalizedUrl)
        return data.data.normalizedUrl
      }
    }
    
    throw new Error('Could not validate domain')
  } catch (error) {
    throw new Error('Invalid URL format or domain is inaccessible. Please enter a valid website address.')
  }
}

/**
 * Attempts to find sitemap URLs from robots.txt
 */
async function findSitemapsInRobots(domain: string): Promise<string[]> {
  try {
    const apiUrl = `/api/robots?url=${encodeURIComponent(domain)}`
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      console.debug('No robots.txt found at:', domain)
      return []
    }
    
    const { data: robotsText } = await response.json()
    if (!robotsText?.includes('User-agent:')) return []

    const sitemapMatches = robotsText.match(/Sitemap:\s*(.+)/gi)
    
    if (sitemapMatches && sitemapMatches.length > 0) {
      return sitemapMatches
        .map((match: string) => {
          try {
            const url = match.replace(/Sitemap:\s*/i, '').trim()
            // Validate it's a proper URL
            new URL(url)
            return url
          } catch {
            return ''
          }
        })
        .filter((url: string) => url && url.endsWith('.xml'))
    }
  } catch (error) {
    console.debug('Error checking robots.txt:', error)
  }
  
  return []
}

/**
 * Fetches XML content and validates it's a sitemap
 */
interface SitemapValidationResult {
  content: string;
  hasUrls: boolean;
}

export async function fetchAndValidateXml(url: string): Promise<SitemapValidationResult | null> {
  try {
    const apiUrl = `/api/sitemap?url=${encodeURIComponent(url)}`
    const response = await fetch(apiUrl)
    
    // Skip 404s silently - they're expected when checking variants
    if (response.status === 404) {
      return null
    }
    
    if (!response.ok) {
      console.debug('Error fetching sitemap:', url, response.status)
      throw new Error('Failed to fetch sitemap')
    }

    const { data: xmlText } = await response.json()
    
    // Basic validation
    if (!xmlText?.trim()) {
      return null
    }
    
    // Check if the sitemap actually contains URLs or sub-sitemaps
    const hasUrls = xmlText.includes('<loc>') && 
      (xmlText.includes('</url>') || xmlText.includes('</sitemap>'))
    
    return {
      content: xmlText,
      hasUrls
    }
  } catch (error) {
    console.debug('Error fetching sitemap:', url, error)
    throw error
  }
}

/**
 * Parses sitemap XML response
 */
function parseSitemapResponse(xmlText: string, domain: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
  })
  
  try {
    const data = parser.parse(xmlText)
    
    // Handle sitemap index files
    if (data.sitemapindex) {
      const sitemaps = Array.isArray(data.sitemapindex.sitemap)
        ? data.sitemapindex.sitemap
        : [data.sitemapindex.sitemap]
      
      return {
        urls: [],
        availableSitemaps: sitemaps.map((s: SitemapEntry) => s.loc)
      }
    }
    
    // Handle regular sitemaps
    if (data.urlset) {
      const urls = Array.isArray(data.urlset.url)
        ? data.urlset.url
        : [data.urlset.url]
      
      return {
        urls: urls.map((u: SitemapUrl) => ({
          loc: u.loc,
          lastmod: u.lastmod,
          priority: u.priority,
          changefreq: u.changefreq
        }))
      }
    }
    
    throw new Error('Invalid sitemap format')
  } catch (error) {
    console.debug('Error parsing sitemap XML:', error)
    throw error
  }
}

/**
 * Fetches and parses a sitemap from a given URL
 */
export async function fetchSitemap(url: string, enabledSitemaps?: Set<string>): Promise<SitemapData> {
  try {
    // First resolve the correct domain
    const resolvedDomain = await resolveDomain(url)
    console.debug('Resolved domain:', resolvedDomain)
    
    // Common sitemap locations to try, ordered by priority
    const commonLocations = [
      '/sitemap.xml',           // Most common standard location
      '/sitemap_index.xml',     // Common index location
      '/sitemapindex.xml',      // Alternative index name
      '/sitemap/sitemap.xml',   // Common subfolder location
      '/sitemap-index.xml',     // Hyphenated variant
    ]
    
    // Try to get sitemap URLs from robots.txt first
    const robotsSitemaps = await findSitemapsInRobots(resolvedDomain)
    console.debug('Found sitemaps in robots.txt:', robotsSitemaps)

    // If no sitemaps found in robots.txt and domain doesn't start with www,
    // try www prefix version
    if (robotsSitemaps.length === 0 && !new URL(resolvedDomain).hostname.startsWith('www.')) {
      const wwwDomain = new URL(resolvedDomain)
      wwwDomain.hostname = 'www.' + wwwDomain.hostname
      const wwwRobotsSitemaps = await findSitemapsInRobots(wwwDomain.origin)
      if (wwwRobotsSitemaps.length > 0) {
        console.debug('Found sitemaps in www robots.txt:', wwwRobotsSitemaps)
        robotsSitemaps.push(...wwwRobotsSitemaps)
      }
    }
    
    // Keep track of all attempted URLs and found sitemaps
    const attemptedUrls = new Set<string>()
    const foundSitemaps: string[] = []
    const urlsBySource: Record<string, SitemapUrl[]> = {}
    const uniqueUrls = new Set<string>() // Track unique URLs by their loc
    
    // Function to try a sitemap URL
    async function trySitemapUrl(sitemapUrl: string): Promise<SitemapData | null> {
      if (attemptedUrls.has(sitemapUrl)) {
        console.debug('Already attempted:', sitemapUrl)
        return null
      }
      
      // Skip if sitemaps are enabled and this one isn't in the list
      if (enabledSitemaps && enabledSitemaps.size > 0 && !enabledSitemaps.has(sitemapUrl)) {
        console.debug('Skipping disabled sitemap:', sitemapUrl)
        return null
      }
      
      console.debug('Trying sitemap URL:', sitemapUrl)
      attemptedUrls.add(sitemapUrl)
      
      try {
        const validationResult = await fetchAndValidateXml(sitemapUrl)
        if (!validationResult) {
          return null
        }

        const { content, hasUrls } = validationResult
        foundSitemaps.push(sitemapUrl)
        console.debug('Found valid sitemap at:', sitemapUrl, 'Has URLs:', hasUrls)
        
        if (hasUrls) {
          const result = parseSitemapResponse(content, resolvedDomain)
          
          // Deduplicate URLs while preserving the newest lastmod
          if (result.urls?.length > 0) {
            const newUrls = result.urls.filter((url: SitemapUrl) => {
              if (!uniqueUrls.has(url.loc)) {
                uniqueUrls.add(url.loc)
                return true
              }
              // Update lastmod if newer
              const existingUrl = Object.values(urlsBySource)
                .flat()
                .find(u => u.loc === url.loc)
              if (existingUrl && url.lastmod && (!existingUrl.lastmod || new Date(url.lastmod) > new Date(existingUrl.lastmod))) {
                existingUrl.lastmod = url.lastmod
              }
              return false
            })
            
            if (newUrls.length > 0) {
              urlsBySource[sitemapUrl] = newUrls
              return {
                urls: newUrls,
                availableSitemaps: foundSitemaps,
                urlsBySource
              }
            }
          }
          
          if (result.availableSitemaps?.length) {
            // Try sub-sitemaps in sequence to avoid overwhelming the server
            for (const subSitemapUrl of result.availableSitemaps) {
              const subResult = await trySitemapUrl(subSitemapUrl)
              if (subResult?.urls.length) {
                return {
                  ...subResult,
                  availableSitemaps: result.availableSitemaps,
                  urlsBySource
                }
              }
            }
          }
        }
      } catch (error) {
        console.debug('Error trying sitemap URL:', sitemapUrl, error)
      }
      return null
    }
    
    // Try robots.txt sitemaps first, then common locations
    const allSitemapUrls = [
      ...robotsSitemaps,
      ...commonLocations.map(path => new URL(path, resolvedDomain).href)
    ]
    
    console.debug('Attempting sitemap URLs:', allSitemapUrls)
    
    // Process sitemaps sequentially to avoid overwhelming the server
    let foundValidUrls = false
    for (const sitemapUrl of allSitemapUrls) {
      const result = await trySitemapUrl(sitemapUrl)
      if (result?.urls.length) {
        foundValidUrls = true
      }
    }

    // If we found any URLs, return them all
    if (foundValidUrls) {
      return {
        urls: Array.from(uniqueUrls).map(loc => {
          const urlData = Object.values(urlsBySource)
            .flat()
            .find(u => u.loc === loc)
          return urlData || { loc }
        }),
        resolvedDomain,
        availableSitemaps: foundSitemaps,
        urlsBySource
      }
    }

    // If we found sitemaps but no URLs, return that info
    if (foundSitemaps.length > 0) {
      console.debug('Found sitemaps but no URLs:', foundSitemaps)
      return {
        urls: [],
        resolvedDomain,
        availableSitemaps: foundSitemaps,
        urlsBySource,
        error: 'Found sitemaps but they contained no URLs. Try using a specific sitemap.',
        errorType: 'PARSE_ERROR'
      }
    }

    // No sitemaps found
    console.debug('No sitemaps found at all')
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
      error: error instanceof Error ? error.message : 'Failed to access the website',
      errorType: 'ACCESS_ERROR'
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