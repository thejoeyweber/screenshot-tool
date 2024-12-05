/**
 * Sitemap Service
 * 
 * Purpose: Fetch and process website sitemaps
 */

import { normalizeUrl, getBaseUrl } from './url'
import { XMLParser } from 'fast-xml-parser'

export interface SitemapUrl {
  loc: string
  lastmod?: string
  priority?: number
  changefreq?: string
}

export interface SitemapResult {
  urls: SitemapUrl[]
  error?: string
  errorType?: string
  availableSitemaps?: string[]
  hasMoreOptions?: boolean
}

async function fetchWithTimeout(url: string): Promise<string> {
  console.log('🔍 Fetching sitemap URL:', url)
  const response = await fetch(`/api/sitemap?url=${encodeURIComponent(url)}`)
  
  if (!response.ok) {
    console.error('❌ Fetch failed:', response.status, response.statusText)
    throw new Error(`Failed to fetch sitemap: ${response.statusText}`)
  }
  
  const data = await response.json()
  if (data.error) {
    console.error('❌ API error:', data.error)
    throw new Error(data.error)
  }
  
  console.log('✅ Fetch successful, XML length:', data.data.length)
  return data.data
}

async function findSitemapUrls(baseUrl: string, mode: 'primary' | 'secondary' | 'extended' = 'primary'): Promise<string[]> {
  console.log('🔍 Finding sitemaps for base URL:', baseUrl)
  const sitemapUrls = []
  const normalizedBase = normalizeUrl(baseUrl)
  console.log('📝 Normalized base URL:', normalizedBase)

  const response = await fetch('/api/fetch-sitemaps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: normalizedBase })
  })

  if (!response.ok) {
    console.error('❌ Fetch sitemaps failed:', response.status)
    throw new Error('Failed to fetch sitemaps')
  }

  const data = await response.json()
  console.log('📄 Sitemaps API response:', data)
  
  if (!data.success) {
    console.error('❌ Sitemaps API error:', data.error)
    throw new Error(data.error || 'Failed to fetch sitemaps')
  }

  console.log('✅ Found sitemaps:', data.data.sitemapUrls)
  return data.data.sitemapUrls
}

async function parseSitemapXml(xml: string, baseUrl: string): Promise<SitemapUrl[]> {
  console.log('🔍 Parsing sitemap XML for base URL:', baseUrl)
  console.log('📄 XML preview:', xml.substring(0, 200))
  
  // Try old-style parsing first (simpler, worked before)
  try {
    const urls: SitemapUrl[] = []
    const locMatches = xml.match(/<loc>([^<]+)<\/loc>/g)
    
    if (locMatches) {
      console.log('✅ Found URL matches using simple parsing:', locMatches.length)
      for (const match of locMatches) {
        const loc = match.replace(/<\/?loc>/g, '').trim()
        const normalizedLoc = normalizeUrl(loc)
        
        if (normalizedLoc.startsWith(normalizeUrl(baseUrl))) {
          urls.push({ loc: normalizedLoc })
        }
      }
      
      if (urls.length > 0) {
        console.log('✅ Successfully extracted URLs:', urls.length)
        return urls
      }
    }
  } catch (error) {
    console.log('⚠️ Simple parsing failed, trying XML parser')
  }
  
  // If simple parsing failed or found no URLs, try the XML parser
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
    removeNSPrefix: true,
    isArray: (name) => ['url', 'sitemap'].includes(name)
  })
  
  try {
    const result = parser.parse(xml)
    console.log('📄 Parsed XML structure:', JSON.stringify(result, null, 2))
    const urls: SitemapUrl[] = []

    if (result.sitemapindex?.sitemap) {
      console.log('📑 Found sitemap index')
      const sitemaps = result.sitemapindex.sitemap
      
      for (const sitemap of sitemaps) {
        try {
          const subXml = await fetchWithTimeout(sitemap.loc)
          const subUrls = await parseSitemapXml(subXml, baseUrl)
          urls.push(...subUrls)
        } catch (error) {
          console.error('❌ Sub-sitemap error:', error)
        }
      }
    }

    if (result.urlset?.url) {
      console.log('📑 Found URL set')
      const urlNodes = result.urlset.url
      
      for (const node of urlNodes) {
        if (node.loc) {
          const urlLoc = typeof node.loc === 'object' ? node.loc['#text'] : node.loc
          const url: SitemapUrl = { loc: normalizeUrl(urlLoc) }
          
          if (node.lastmod) url.lastmod = node.lastmod
          if (node.priority) url.priority = parseFloat(node.priority)
          if (node.changefreq) url.changefreq = node.changefreq

          if (url.loc.startsWith(normalizeUrl(baseUrl))) {
            urls.push(url)
          }
        }
      }
    }

    console.log('✅ Extracted URLs:', urls.length)
    return urls
  } catch (error) {
    console.error('❌ XML parsing error:', error)
    console.error('📄 Problematic XML:', xml)
    return []
  }
}

export async function fetchSitemap(
  url: string, 
  enabledSitemaps?: Set<string>,
  mode: 'primary' | 'secondary' | 'extended' = 'primary'
): Promise<SitemapResult> {
  try {
    const baseUrl = getBaseUrl(url)
    const sitemapUrls = await findSitemapUrls(baseUrl, mode)

    if (sitemapUrls.length === 0) {
      return {
        urls: [],
        error: 'No sitemap found. Try entering URLs manually.',
        errorType: 'SITEMAP_NOT_FOUND',
        availableSitemaps: [],
        hasMoreOptions: mode !== 'extended'
      }
    }

    const urls: SitemapUrl[] = []
    const filteredSitemaps = enabledSitemaps ? 
      sitemapUrls.filter(url => enabledSitemaps.has(url)) : 
      sitemapUrls

    for (const sitemapUrl of filteredSitemaps) {
      try {
        const xml = await fetchWithTimeout(sitemapUrl)
        const sitemapUrls = await parseSitemapXml(xml, baseUrl)
        urls.push(...sitemapUrls)
      } catch (error) {
        console.error(`Error fetching sitemap ${sitemapUrl}:`, error)
      }
    }

    if (urls.length === 0) {
      return {
        urls: [],
        error: 'No valid URLs found in sitemap.',
        errorType: 'PARSE_ERROR',
        availableSitemaps: sitemapUrls,
        hasMoreOptions: mode !== 'extended'
      }
    }

    return {
      urls: [...new Set(urls)], // Remove duplicates
      availableSitemaps: sitemapUrls,
      hasMoreOptions: mode !== 'extended'
    }
  } catch (error) {
    console.error('Fetch error:', error)
    return {
      urls: [],
      error: error instanceof Error ? error.message : 'Failed to fetch sitemap',
      errorType: 'ACCESS_ERROR',
      availableSitemaps: [],
      hasMoreOptions: mode !== 'extended'
    }
  }
}

export function organizeUrlTree(urls: SitemapUrl[]): Record<string, SitemapUrl[]> {
  const groups: Record<string, SitemapUrl[]> = {
    '/': []
  }

  urls.forEach(url => {
    try {
      const parsed = new URL(url.loc)
      const path = parsed.pathname
      const parts = path.split('/').filter(Boolean)
      
      if (parts.length === 0) {
        groups['/'].push(url)
      } else {
        const group = `/${parts[0]}`
        if (!groups[group]) {
          groups[group] = []
        }
        groups[group].push(url)
      }
    } catch {
      groups['/'].push(url)
    }
  })

  return groups
}
