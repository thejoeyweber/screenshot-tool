/**
 * Generate Page
 * 
 * Purpose: Batch screenshot generation
 * Functionality: Process URLs from session with batch service
 */

'use client'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, ReadonlyURLSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle, CheckCircle2, ChevronRight, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useUrlSession } from "@/hooks/useUrlSession"
import type { BatchJob } from "@/types/batch"
import type { Screenshot } from "@/types/screenshot"
import { normalizeUrl } from '@/services/url'
import { deviceConfigs, type DeviceName } from '@/config/devices'
import { SearchParamsProvider } from "@/components/providers/SearchParamsProvider"

interface BatchResult extends Screenshot {
  error?: string
  status?: string
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'processing':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />
  }
}

interface GeneratePageContentProps {
  searchParams: ReadonlyURLSearchParams
}

function GeneratePageContent({ searchParams }: GeneratePageContentProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { getSession, updateSession } = useUrlSession()
  
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [currentJob, setCurrentJob] = useState<BatchJob | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load session and start batch
  useEffect(() => {
    const sid = searchParams.get('session')
    if (!sid) {
      toast({
        title: "Session Error",
        description: "No session ID provided",
        variant: "destructive"
      })
      router.push('/')
      return
    }

    const session = getSession(sid)
    if (!session) {
      toast({
        title: "Session Error",
        description: "Invalid or expired session",
        variant: "destructive"
      })
      router.push('/')
      return
    }

    setSessionId(sid)
    setLoading(false)
  }, [searchParams, getSession, router, toast])

  // Add start batch handler
  const handleStartBatch = async () => {
    try {
      const session = getSession(sessionId!)
      if (!session?.config?.deviceConfig) {
        throw new Error('Invalid session configuration')
      }

      const normalizedUrls = session.urls.map(url => normalizeUrl(url))
      
      const deviceName = session.config.deviceConfig as DeviceName
      if (!Object.keys(deviceConfigs).includes(deviceName)) {
        throw new Error('Invalid device configuration')
      }
      
      const deviceConfig = deviceConfigs[deviceName]
      
      const response = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: normalizedUrls,
          config: {
            delay: session.config.delay ?? 2000,
            hideSelectors: session.config.hideSelectors ?? [],
            maxDimension: session.config.maxDimension ?? 10000,
            quality: session.config.quality ?? 90,
            maxFileSize: session.config.maxFileSize ?? (10 * 1024 * 1024),
            deviceConfig
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start batch processing')
      }

      const data = await response.json()
      setCurrentJobId(data.jobId)
      setIsPolling(true)
      
      updateSession(sessionId!, {
        currentJobId: data.jobId,
        results: {
          order: [],
          screenshots: [],
          annotations: {}
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start batch processing')
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to start batch processing',
        variant: "destructive"
      })
    }
  }

  // Poll for job status
  useEffect(() => {
    if (!currentJobId || !isPolling) return

    console.log('Starting polling for job:', currentJobId)

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/batch?jobId=${currentJobId}`)
        if (!response.ok) throw new Error('Failed to get status')
        const job = await response.json()

        console.log('Polling response:', {
          jobId: currentJobId,
          status: job.status,
          progress: job.progress
        })

        setCurrentJob(job)

        if (['completed', 'failed', 'completed_with_errors'].includes(job.status)) {
          setIsPolling(false)
          
          if (sessionId) {
            const results = job.results || []
            await updateSession(sessionId, {
              results: {
                screenshots: results,
                order: results.map((r: { id: string }) => r.id),
                annotations: {}
              }
            })

            toast({
              title: job.status === 'failed' ? 'Process Failed' : 'Process Complete',
              description: job.error || `Processed ${results.length} of ${job.urls.length} URLs`,
              variant: job.status === 'failed' ? 'destructive' : 'default'
            })

            if (job.status === 'completed' && results.length === job.urls.length) {
              setTimeout(() => router.push(`/customize?session=${sessionId}`), 2000)
            }
          }

          // Reset states after completion
          if (job.status === 'failed') {
            setCurrentJobId(null)
            setCurrentJob(null)
          }
        }
      } catch (err) {
        console.error('Polling error:', err)
        setError(err instanceof Error ? err.message : 'Failed to get job status')
        setIsPolling(false)
        setCurrentJobId(null)
        setCurrentJob(null)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [currentJobId, isPolling, sessionId, updateSession, router, toast])

  const handleRetry = async () => {
    if (!currentJobId) return
    
    try {
      const response = await fetch(`/api/batch/${currentJobId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry' })
      })
      
      if (!response.ok) throw new Error('Failed to retry job')
      
      setIsPolling(true)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry job')
    }
  }

  const handleContinue = () => {
    if (!sessionId) return
    router.push(`/customize?session=${sessionId}`)
  }

  // Update the UI rendering for better status display
  const getUrlStatus = (url: string, index: number) => {
    if (!currentJob) return 'pending'
    
    const result = currentJob.results?.find(r => r.url === url)
    if (result) return 'completed'
    
    const isProcessing = 
      currentJob.status === 'processing' &&
      index >= (currentJob.results?.length || 0) &&
      index < (currentJob.results?.length || 0) + 3
    
    return isProcessing ? 'processing' : 'pending'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground"
        >
          Loading...
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        className="w-full max-w-2xl space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Generate Screenshots</h1>
          {currentJob && (
            <p className="text-muted-foreground">
              Processing {currentJob.results.length} of {currentJob.urls.length} pages...
            </p>
          )}
        </div>

        <Card className="p-6 space-y-6">
          {currentJob && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{currentJob.progress.toFixed(1)}%</span>
              </div>
              <Progress value={currentJob.progress} />
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleStartBatch}
              disabled={!!currentJobId || loading}
              className="w-full"
            >
              Start Generation
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {currentJob?.urls.map((url, index) => {
                const status = getUrlStatus(url, index)
                const result = currentJob.results.find(r => r.url === url) as BatchResult | undefined
                
                return (
                  <div
                    key={url}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-2">
                      <StatusIcon status={status} />
                      <span className="text-sm truncate max-w-[400px]">{url}</span>
                    </div>
                    {result?.error && (
                      <span className="text-sm text-red-500">{result.error}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          {currentJob?.status === 'completed' && (
            <Button onClick={handleContinue}>
              Continue to Customize
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function GeneratePage() {
  return (
    <SearchParamsProvider>
      {(searchParams) => {
        return <GeneratePageContent searchParams={searchParams} />
      }}
    </SearchParamsProvider>
  )
} 