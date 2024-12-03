/**
 * Sitemap Page
 * 
 * Purpose: Shows sitemap URLs and allows selection
 * Functionality: Fetches sitemap, displays URL tree, handles selection
 * Relationships: Uses sitemap service and URL tree components
 */

'use client'

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Upload, List, Globe, FileWarning } from "lucide-react"
import { Input } from "@/components/ui/input"
import { fetchSitemap, organizeUrlTree, type SitemapUrl } from "@/services/sitemap"
import { UrlTree } from "@/components/sitemap/UrlTree"
import { useUrlSession } from "@/hooks/useUrlSession"

interface ErrorDisplay {
  title: string
  description: string
  icon: React.ReactNode
  showAlternatives: boolean
}

function getErrorDisplay(error: string, errorType?: string): ErrorDisplay {
  switch (errorType) {
    case 'ACCESS_ERROR':
      return {
        title: 'Cannot Access Website',
        description: error,
        icon: <Globe className="h-4 w-4" />,
        showAlternatives: false
      }
    case 'SITEMAP_NOT_FOUND':
      return {
        title: 'No Sitemap Found',
        description: error,
        icon: <FileWarning className="h-4 w-4" />,
        showAlternatives: true
      }
    case 'PARSE_ERROR':
      return {
        title: 'Sitemap Processing Error',
        description: error,
        icon: <AlertCircle className="h-4 w-4" />,
        showAlternatives: true
      }
    default:
      return {
        title: 'Error',
        description: error,
        icon: <AlertCircle className="h-4 w-4" />,
        showAlternatives: true
      }
  }
}

export default function SitemapPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialUrl = searchParams.get('url')
  const { createSession } = useUrlSession()
  
  const [url, setUrl] = useState(initialUrl || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [errorType, setErrorType] = useState<string>()
  const [urlGroups, setUrlGroups] = useState<Record<string, SitemapUrl[]>>({})
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [availableSitemaps, setAvailableSitemaps] = useState<string[]>([])

  const loadSitemap = async (targetUrl: string) => {
    setLoading(true)
    setError(undefined)
    setErrorType(undefined)
    setAvailableSitemaps([])
    
    try {
      const data = await fetchSitemap(targetUrl)
      if (data.error) {
        setError(data.error)
        setErrorType(data.errorType)
        setUrlGroups({})
        if (data.availableSitemaps) {
          setAvailableSitemaps(data.availableSitemaps)
        }
      } else {
        const groups = organizeUrlTree(data.urls)
        setUrlGroups(groups)
        // Auto-select all URLs initially
        setSelectedUrls(new Set(data.urls.map(u => u.loc)))
        if (data.availableSitemaps) {
          setAvailableSitemaps(data.availableSitemaps)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sitemap')
      setUrlGroups({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialUrl) {
      setLoading(false)
      return
    }

    loadSitemap(initialUrl)
  }, [initialUrl])

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    
    // Update URL in browser history
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('url', url)
    router.push(newUrl.pathname + newUrl.search)
    
    loadSitemap(url)
  }

  const handleSitemapSelect = (sitemapUrl: string) => {
    setUrl(sitemapUrl)
    loadSitemap(sitemapUrl)
  }

  const handleUrlToggle = (url: SitemapUrl) => {
    const newSelected = new Set(selectedUrls)
    if (newSelected.has(url.loc)) {
      newSelected.delete(url.loc)
    } else {
      newSelected.add(url.loc)
    }
    setSelectedUrls(newSelected)
  }

  const handleSelectAll = () => {
    const allUrls = new Set<string>()
    Object.values(urlGroups).flat().forEach(url => {
      allUrls.add(url.loc)
    })
    setSelectedUrls(allUrls)
  }

  const handleSelectNone = () => {
    setSelectedUrls(new Set())
  }

  const handleContinue = () => {
    if (selectedUrls.size === 0) {
      setError('Please select at least one URL')
      return
    }
    
    try {
      // Create a new session with the selected URLs
      const sessionId = createSession(url, Array.from(selectedUrls))
      
      // Navigate to setup with just the session ID
      const setupUrl = new URL('/setup', window.location.origin)
      setupUrl.searchParams.set('session', sessionId)
      router.push(setupUrl.pathname + setupUrl.search)
    } catch (err) {
      setError('Failed to save selected URLs. Please try again.')
      console.error('Error saving URLs:', err)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Select Pages to Capture</h1>
        {Object.keys(urlGroups).length > 0 && (
          <Button onClick={handleContinue}>
            Continue ({selectedUrls.size} pages selected)
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Website URL</CardTitle>
          <CardDescription>
            Enter your website URL to fetch available pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter website URL (e.g., example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch Pages'}
            </Button>
          </form>

          {error && (
            <div className="space-y-4">
              {(() => {
                const { title, description, icon, showAlternatives } = getErrorDisplay(error, errorType)
                return (
                  <>
                    <Alert variant="destructive">
                      {icon}
                      <AlertTitle>{title}</AlertTitle>
                      <AlertDescription className="whitespace-pre-line mt-2">
                        {description}
                      </AlertDescription>
                    </Alert>

                    {availableSitemaps.length > 0 && (
                      <div className="border rounded-lg p-4 space-y-2">
                        <h3 className="font-medium">Available Sitemaps:</h3>
                        <div className="space-y-2">
                          {availableSitemaps.map((sitemap, index) => (
                            <Button
                              key={sitemap}
                              variant="outline"
                              className="w-full justify-start text-left font-mono text-sm"
                              onClick={() => handleSitemapSelect(sitemap)}
                            >
                              {sitemap}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {showAlternatives && (
                      <div className="border rounded-lg p-4 space-y-4">
                        <h3 className="font-medium">Alternative Options:</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Button variant="outline" className="w-full" disabled>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Sitemap XML
                          </Button>
                          <Button variant="outline" className="w-full" disabled>
                            <List className="h-4 w-4 mr-2" />
                            Enter URLs Manually
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {!loading && Object.keys(urlGroups).length > 0 && (
        <UrlTree
          urlGroups={urlGroups}
          selectedUrls={selectedUrls}
          onUrlToggle={handleUrlToggle}
          onSelectAll={handleSelectAll}
          onSelectNone={handleSelectNone}
        />
      )}
    </div>
  )
} 