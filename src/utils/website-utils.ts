/**
 * Website Utilities
 * 
 * Shared functions for interacting with external websites
 */

/**
 * Fetches a URL with proper error handling and timeout
 */
export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const defaultOptions: RequestInit = {
    mode: 'cors',
    credentials: 'omit',
    headers: {
      'Accept': 'text/xml, application/xml, application/xhtml+xml, text/html;q=0.9, text/plain;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; SitemapFetcher/1.0)'
    }
  };

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
      signal: controller.signal,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    });
    clearTimeout(id);
    
    // Handle non-200 responses
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
    throw new Error('Network request failed');
  }
}

/**
 * Extracts sitemap URLs from robots.txt content
 */
export function extractSitemapsFromRobotsTxt(robotsTxt: string): string[] {
  const sitemaps: string[] = [];
  const lines = robotsTxt.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim().toLowerCase();
    if (trimmedLine.startsWith('sitemap:')) {
      const sitemap = trimmedLine.substring('sitemap:'.length).trim();
      if (sitemap) sitemaps.push(sitemap);
    }
  }

  return sitemaps;
}

/**
 * Validates and processes XML sitemap content
 */
export function extractUrlsFromSitemap(sitemapXml: string): string[] {
  const urls: string[] = [];
  const matches = sitemapXml.match(/<loc>([^<]+)<\/loc>/g);

  if (matches) {
    for (const match of matches) {
      const url = match.replace(/<\/?loc>/g, '').trim();
      if (url) urls.push(url);
    }
  }

  return urls;
} 