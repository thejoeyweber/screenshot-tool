'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, ChevronRight, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { BatchJob } from '@/types/batch'

interface TestResult {
  name: string
  status: 'running' | 'success' | 'error'
  message?: string
  data?: Record<string, unknown>
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

export default function BatchTestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [currentJob, setCurrentJob] = useState<BatchJob | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [completedJob, setCompletedJob] = useState<BatchJob | null>(null)

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result])
  }

  const testUrls = [
    'https://example.com',
    'https://google.com',
    'https://github.com'
  ]

  // Poll for job status when we have a jobId
  useEffect(() => {
    if (!currentJobId || !isPolling) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/batch?jobId=${currentJobId}`)
        if (!response.ok) throw new Error('Failed to get status')
        const job = await response.json()
        setCurrentJob(job)

        // Stop polling if job is complete, failed, or has errors
        if (['completed', 'failed', 'completed_with_errors'].includes(job.status)) {
          setIsPolling(false)
          setCompletedJob(job)
          
          // Add completion result
          addResult({
            name: 'Batch Complete',
            status: job.status === 'failed' ? 'error' : 'success',
            message: job.status === 'completed' 
              ? `Successfully processed ${job.results.length} screenshots` 
              : job.error || 'Batch completed with some errors',
            data: {
              total: job.urls.length,
              completed: job.results.length,
              status: job.status
            }
          })

          // Only reset currentJob/JobId after completion
          if (job.status === 'completed' || job.status === 'failed') {
            setTimeout(() => {
              setCurrentJobId(null)
              setCurrentJob(null)
            }, 2000)
          }
        }
      } catch (error) {
        console.error('Status polling error:', error)
        setIsPolling(false)
        setCurrentJobId(null)
        setCurrentJob(null)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [currentJobId, isPolling])

  const runTest = async (name: string, fn: () => Promise<Record<string, unknown>>) => {
    addResult({ name, status: 'running' })
    try {
      const data = await fn()
      addResult({ name, status: 'success', data })
      return data
    } catch (error) {
      addResult({
        name,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
      setCurrentJobId(null)
      setCurrentJob(null)
      setIsPolling(false)
      throw error
    }
  }

  const testCreateBatch = async () => {
    const response = await fetch('/api/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        urls: testUrls,
        config: {
          deviceConfig: {
            name: 'Desktop',
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
            isMobile: false
          },
          delay: 1000,
          quality: 80
        }
      })
    })

    if (!response.ok) throw new Error('Failed to create batch')
    const data = await response.json()
    setCurrentJobId(data.jobId)
    setIsPolling(true)
    return data
  }

  const testGetStatus = async () => {
    if (!currentJobId) throw new Error('No job ID')
    const response = await fetch(`/api/batch?jobId=${currentJobId}`)
    if (!response.ok) throw new Error('Failed to get status')
    const job = await response.json()
    setCurrentJob(job)
    return job
  }

  const testJobControl = async (action: 'pause' | 'resume' | 'cancel') => {
    if (!currentJobId) throw new Error('No job ID')
    const response = await fetch(`/api/batch/${currentJobId}/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })
    if (!response.ok) throw new Error(`Failed to ${action} job`)
    const data = await response.json()
    if (action === 'resume') {
      setIsPolling(true)
    } else if (action === 'cancel') {
      setCurrentJobId(null)
      setCurrentJob(null)
      setIsPolling(false)
    }
    return data
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
          <h1 className="text-2xl font-bold">Batch Processing Tests</h1>
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

          <div className="space-y-2">
            <Button 
              onClick={() => runTest('Create Batch', testCreateBatch)}
              disabled={!!currentJobId && currentJob?.status !== 'failed'}
            >
              Create Test Batch
            </Button>

            <Button 
              onClick={() => runTest('Get Status', testGetStatus)}
              disabled={!currentJobId}
              className="ml-2"
            >
              Check Status
            </Button>

            <Button 
              onClick={() => runTest('Pause Job', () => testJobControl('pause'))}
              disabled={!currentJobId || !currentJob || currentJob.status !== 'processing'}
              className="ml-2"
            >
              Pause
            </Button>

            <Button 
              onClick={() => runTest('Resume Job', () => testJobControl('resume'))}
              disabled={!currentJobId || !currentJob || currentJob.status !== 'queued'}
              className="ml-2"
            >
              Resume
            </Button>

            <Button 
              onClick={() => runTest('Cancel Job', () => testJobControl('cancel'))}
              disabled={!currentJobId}
              variant="destructive"
              className="ml-2"
            >
              Cancel
            </Button>
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {(currentJob || completedJob)?.urls.map((url, index) => {
                const job = currentJob || completedJob;
                const isProcessing = job?.status === 'processing';
                const isCompleted = job?.status === 'completed' || job?.status === 'completed_with_errors';
                const isFailed = job?.status === 'failed';
                
                let status = 'queued';
                if (isCompleted && index < (job?.results.length || 0)) {
                  status = 'completed';
                } else if (isProcessing && index < (job?.results.length || 0)) {
                  status = 'completed';
                } else if (isProcessing && index < (job?.results.length || 0) + 3) {
                  // Show loading for current chunk (up to 3 concurrent)
                  status = 'processing';
                } else if (isFailed) {
                  status = 'failed';
                }

                return (
                  <div
                    key={url}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-2">
                      <StatusIcon status={status} />
                      <span className="text-sm">{url}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {results.length > 0 && (
            <Card className="mt-4 p-4">
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {results.map((result, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded ${
                        result.status === 'running'
                          ? 'bg-blue-100'
                          : result.status === 'success'
                          ? 'bg-green-100'
                          : 'bg-red-100'
                      }`}
                    >
                      <div className="font-medium">{result.name}</div>
                      {result.message && (
                        <div className="text-sm text-gray-600">{result.message}</div>
                      )}
                      {result.data && (
                        <pre className="text-xs mt-2 bg-gray-50 p-2 rounded">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}

          {currentJob?.status === 'failed' && (
            <Alert variant="destructive">
              <AlertDescription>
                Batch processing failed. You can try again or check the logs for details.
              </AlertDescription>
            </Alert>
          )}
        </Card>
      </motion.div>
    </div>
  )
} 