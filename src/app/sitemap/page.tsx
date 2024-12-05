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
import { AlertCircle, Loader2, Upload, List, Globe, FileWarning, FileCheck, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
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
  const [enabledSitemaps, setEnabledSitemaps] = useState<Set<string>>(new Set())
  const [searchMode, setSearchMode] = useState<'primary' | 'secondary' | 'extended'>('primary')
  const [hasMoreOptions, setHasMoreOptions] = useState(false)

  const loadSitemap = async (targetUrl: string, sitemaps?: Set<string>) => {
    setLoading(true)
    setError(undefined)
    setErrorType(undefined)
    
    try {
      console.log('Fetching sitemap for:', targetUrl, 'mode:', searchMode)
      const data = await fetchSitemap(targetUrl, sitemaps, searchMode)
      console.log('Sitemap response:', data)
      
      if (data.error) {
        setError(data.error)
        setErrorType(data.errorType)
        setUrlGroups({})
        if (data.availableSitemaps) {
          console.log('Available sitemaps:', data.availableSitemaps)
          setAvailableSitemaps(data.availableSitemaps)
          if (!sitemaps) {
            setEnabledSitemaps(new Set(data.availableSitemaps))
          }
        }
        if (data.hasMoreOptions) {
          setHasMoreOptions(true)
        }
      } else {
        const groups = organizeUrlTree(data.urls)
        console.log('Parsed URL groups:', groups)
        setUrlGroups(groups)
        setSelectedUrls(new Set(data.urls.map(u => u.loc)))
        if (data.availableSitemaps) {
          setAvailableSitemaps(data.availableSitemaps)
          if (!sitemaps) {
            setEnabledSitemaps(new Set(data.availableSitemaps))
          }
        }
        setHasMoreOptions(data.hasMoreOptions || false)
      }
    } catch (err) {
      console.error('Sitemap load error:', err)
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
    
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('url', url)
    router.push(newUrl.pathname + newUrl.search)
    
    loadSitemap(url)
  }

  const handleSitemapToggle = (sitemapUrl: string) => {
    const newEnabled = new Set(enabledSitemaps)
    if (newEnabled.has(sitemapUrl)) {
      newEnabled.delete(sitemapUrl)
    } else {
      newEnabled.add(sitemapUrl)
    }
    setEnabledSitemaps(newEnabled)
    
    loadSitemap(url, newEnabled)
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
      const sessionId = createSession(url, Array.from(selectedUrls))
      
      const configUrl = new URL('/config', window.location.origin)
      configUrl.searchParams.set('session', sessionId)
      router.push(configUrl.pathname + configUrl.search)
    } catch (err) {
      setError('Failed to save selected URLs. Please try again.')
      console.error('Error saving URLs:', err)
    }
  }

  const handleSearchMore = () => {
    const nextMode = searchMode === 'primary' ? 'secondary' : 'extended'
    setSearchMode(nextMode)
    loadSitemap(url)
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

                    {(showAlternatives || hasMoreOptions) && (
                      <div className="border rounded-lg p-4 space-y-4">
                        <h3 className="font-medium">Alternative Options:</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          {hasMoreOptions && (
                            <Button 
                              variant="outline" 
                              className="w-full" 
                              onClick={handleSearchMore}
                            >
                              <Search className="h-4 w-4 mr-2" />
                              {searchMode === 'primary' 
                                ? 'Search Additional Locations' 
                                : 'Search Extended Locations'}
                            </Button>
                          )}
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

      {availableSitemaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Sitemaps</CardTitle>
            <CardDescription>
              Enable or disable specific sitemaps to filter the pages shown below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableSitemaps.map((sitemap, index) => (
              <div key={`${sitemap}-${index}`} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <FileCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{sitemap}</span>
                </div>
                <Switch
                  checked={enabledSitemaps.has(sitemap)}
                  onCheckedChange={() => handleSitemapToggle(sitemap)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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