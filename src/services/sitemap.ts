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
 * Normalizes a URL's hostname by removing www if present
 */
function normalizeHostname(hostname: string): string {
  return hostname.replace(/^www\./, '');
}

/**
 * Normalizes a URL by standardizing protocol and www handling
 */
function normalizeUrl(url: string): string {
  const urlObj = new URL(url);
  const normalizedHostname = normalizeHostname(urlObj.hostname);
  urlObj.hostname = normalizedHostname;
  urlObj.protocol = 'https:';
  return urlObj.toString();
}

/**
 * Attempts to resolve the correct domain with various prefixes
 */
async function resolveDomain(url: string): Promise<string> {
  // Normalize the URL
  let domain = url.toLowerCase().trim()
  
  // Add protocol if missing
  if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
    domain = 'https://' + domain;
  }
  
  try {
    // First normalize locally
    domain = normalizeUrl(domain);
    
    // Then validate with server
    const response = await fetch(`/api/validate-url?url=${encodeURIComponent(domain)}`)
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data.normalizedUrl) {
        // Ensure consistent normalization of server response
        return normalizeUrl(data.data.normalizedUrl);
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
 * Checks if a URL entry looks suspicious based on its path and metadata
 */
function isSuspiciousUrl(url: SitemapUrl, sitemapUrl: string): boolean {
  const urlObj = new URL(url.loc);
  const path = urlObj.pathname;

  // Skip empty paths
  if (!path || path === '/') return false;

  // Metadata-based checks
  const hasMetadata = !!(url.lastmod || url.priority || url.changefreq);
  const isFromSitemapIndex = sitemapUrl.includes('sitemap_index.xml') || 
                            sitemapUrl.includes('sitemapindex.xml');

  // Common patterns for auto-generated or suspicious URLs
  const suspiciousPatterns = [
    // Random-looking strings with no clear meaning
    /^\/[a-zA-Z0-9]{12,}$/,
    // Random strings with mixed special chars
    /^\/[a-zA-Z0-9]{8,}[-_][a-zA-Z0-9]{8,}$/,
    // Common spam patterns
    /\/(go|click|redirect|track|ref|affiliate)\/[a-zA-Z0-9-_]{10,}$/i
  ];

  const hasSupiciousPattern = suspiciousPatterns.some(pattern => pattern.test(path));

  // Consider a URL suspicious if:
  // 1. It has a suspicious pattern AND
  // 2. Either:
  //    - It's from a sitemap index and lacks metadata, or
  //    - It matches multiple suspicious patterns
  return hasSupiciousPattern && (
    (isFromSitemapIndex && !hasMetadata) ||
    suspiciousPatterns.filter(p => p.test(path)).length > 1
  );
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
    
    // Try robots.txt sitemaps first, then common locations
    const allSitemapUrls = [
      ...robotsSitemaps,
      ...commonLocations.map(path => new URL(path, resolvedDomain).href)
    ]
    
    console.debug('Attempting sitemap URLs:', allSitemapUrls)
    
    // Process each sitemap URL sequentially to avoid overwhelming the server
    let foundValidUrls = false
    const urlMetadata = new Map<string, SitemapUrl>() // Track URL metadata
    const uniqueSitemaps = new Set<string>() // Track unique sitemap URLs
    const urlToSources = new Map<string, Set<string>>() // Track which sitemaps contain each URL

    console.log('=== Starting Sitemap Processing ===')
    for (const sitemapUrl of allSitemapUrls) {
      try {
        console.log(`\nProcessing sitemap: ${sitemapUrl}`)
        
        // Skip if already processed this sitemap
        if (uniqueSitemaps.has(sitemapUrl)) {
          console.log('- Skipping already processed sitemap')
          continue
        }

        // Skip if sitemaps are enabled and this one isn't in the list
        if (enabledSitemaps && enabledSitemaps.size > 0 && !enabledSitemaps.has(sitemapUrl)) {
          console.log('- Skipping disabled sitemap')
          continue
        }

        const validationResult = await fetchAndValidateXml(sitemapUrl)
        if (!validationResult) {
          console.log('- Invalid or empty sitemap')
          continue
        }

        const { content, hasUrls } = validationResult
        uniqueSitemaps.add(sitemapUrl)
        foundSitemaps.push(sitemapUrl)
        console.log(`- Found valid sitemap with URLs: ${hasUrls}`)
        
        if (hasUrls) {
          const result = parseSitemapResponse(content, resolvedDomain)
          
          // Process URLs from this sitemap
          if (result.urls?.length > 0) {
            console.log(`- Processing ${result.urls.length} URLs`)
            
            result.urls.forEach((url: SitemapUrl) => {
              try {
                // Validate URL and normalize
                const urlObj = new URL(url.loc);
                const normalizedLoc = normalizeUrl(url.loc);
                const path = urlObj.pathname;
                
                // Compare normalized domains
                const normalizedInputDomain = normalizeUrl(resolvedDomain);
                
                if (!normalizedLoc.startsWith(normalizedInputDomain)) {
                  console.log(`  - Skipping external URL: ${url.loc}`);
                  return;
                }
                
                // Skip suspicious URLs
                if (isSuspiciousUrl(url, sitemapUrl)) {
                  console.log(`  - Skipping suspicious URL: ${url.loc} (from ${sitemapUrl})`);
                  if (url.lastmod) console.log(`    Last modified: ${url.lastmod}`);
                  if (url.priority) console.log(`    Priority: ${url.priority}`);
                  if (url.changefreq) console.log(`    Change frequency: ${url.changefreq}`);
                  return;
                }
                
                // Track this URL's presence in current sitemap
                if (!urlToSources.has(normalizedLoc)) {
                  urlToSources.set(normalizedLoc, new Set())
                }
                urlToSources.get(normalizedLoc)!.add(sitemapUrl)
                
                const existing = urlMetadata.get(normalizedLoc)
                
                // Keep the URL with the newest lastmod date, or if no lastmod, keep the most recently found one
                if (!existing || 
                    (url.lastmod && (!existing.lastmod || new Date(url.lastmod) > new Date(existing.lastmod))) ||
                    (!url.lastmod && !existing.lastmod)) {
                  urlMetadata.set(normalizedLoc, {
                    ...url,
                    loc: normalizedLoc // Store normalized URL
                  })
                  foundValidUrls = true
                  console.log(`  - Added/Updated URL: ${normalizedLoc}`)
                }
              } catch (error) {
                console.log(`  - Error processing URL: ${url.loc}`, error)
              }
            })
          }
          
          // Process sub-sitemaps if any
          if (result.availableSitemaps?.length) {
            for (const subSitemapUrl of result.availableSitemaps) {
              if (!uniqueSitemaps.has(subSitemapUrl)) {
                allSitemapUrls.push(subSitemapUrl)
              }
            }
          }
        }
      } catch (error) {
        console.debug('Error processing sitemap:', sitemapUrl, error)
      }
    }

    // Return all collected unique URLs
    if (foundValidUrls) {
      // Get unique URLs sorted by lastmod date (newest first)
      const uniqueUrls = Array.from(urlMetadata.values()).sort((a, b) => {
        if (!a.lastmod && !b.lastmod) return 0
        if (!a.lastmod) return 1
        if (!b.lastmod) return -1
        return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime()
      })

      // Build urlsBySource using only the deduplicated URLs
      const newUrlsBySource: Record<string, SitemapUrl[]> = {}
      for (const url of uniqueUrls) {
        const sources = urlToSources.get(url.loc)
        if (sources) {
          for (const source of sources) {
            if (!newUrlsBySource[source]) {
              newUrlsBySource[source] = []
            }
            newUrlsBySource[source].push(url)
          }
        }
      }

      return {
        urls: uniqueUrls,
        resolvedDomain,
        availableSitemaps: Array.from(uniqueSitemaps),
        urlsBySource: newUrlsBySource
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
  
  // URLs are already deduplicated, just organize them
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
