/**
 * Generate Page
 * 
 * Purpose: Batch screenshot generation
 * Functionality: Process URLs from session with batch service
 */

'use client'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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

export default function GeneratePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
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

    // Start batch processing
    const startBatch = async () => {
      try {
        // Normalize URLs before sending
        const normalizedUrls = session.urls.map(url => normalizeUrl(url))

        const response = await fetch('/api/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            urls: normalizedUrls,
            config: session.config
          })
        })

        if (!response.ok) {
          throw new Error('Failed to start batch processing')
        }

        const data = await response.json()
        setCurrentJobId(data.jobId)
        setIsPolling(true)
        
        // Update session with job ID
        updateSession(sid, {
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
      } finally {
        setLoading(false)
      }
    }

    startBatch()
  }, [searchParams, getSession, router, toast, updateSession])

  // Poll for job status
  useEffect(() => {
    if (!currentJobId || !isPolling) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/batch?jobId=${currentJobId}`)
        if (!response.ok) throw new Error('Failed to get status')
        const job = await response.json()

        // Update current job with normalized URLs
        if (job.urls) {
          job.urls = job.urls.map((url: string) => normalizeUrl(url))
        }
        if (job.results) {
          job.results = job.results.map((r: any) => ({
            ...r,
            url: normalizeUrl(r.url)
          }))
        }

        setCurrentJob(job)

        // Stop polling if job is complete or failed
        if (['completed', 'failed', 'completed_with_errors'].includes(job.status)) {
          setIsPolling(false)
          
          // Update session with results if we have any
          if (sessionId && (job.status === 'completed' || job.status === 'completed_with_errors')) {
            updateSession(sessionId, {
              results: {
                screenshots: job.results,
                order: job.results.map((r: { id: string }) => r.id),
                annotations: {}
              }
            })

            // Auto-continue to customize page after a short delay
            if (job.status === 'completed') {
              setTimeout(() => {
                router.push(`/customize?session=${sessionId}`)
              }, 1000)
            }
          }

          // Clear job after completion
          setTimeout(() => {
            setCurrentJobId(null)
            setCurrentJob(null)
          }, 2000)
        }
      } catch (err) {
        console.error('Status polling error:', err)
        setError(err instanceof Error ? err.message : 'Failed to get job status')
        setIsPolling(false)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [currentJobId, isPolling, sessionId, updateSession, router])

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
          <h1 className="text-2xl font-bold">Generating Screenshots</h1>
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

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {currentJob?.urls.map((url, index) => {
                const result = currentJob.results.find(r => r.url === url) as BatchResult | undefined
                const isProcessing = !result && 
                  index >= currentJob.results.length - 3 && 
                  index < currentJob.results.length && 
                  currentJob.status === 'processing'
                const status = result ? 'completed' : isProcessing ? 'processing' : 'pending'
                
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

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            {currentJob?.status === 'failed' && (
              <Button onClick={handleRetry}>
                Retry
              </Button>
            )}
            {(currentJob?.status === 'completed' || currentJob?.status === 'completed_with_errors') && (
              <Button onClick={handleContinue}>
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
} 