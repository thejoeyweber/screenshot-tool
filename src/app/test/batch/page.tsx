'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function TestBatch() {
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<Record<string, any> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  const testUrls = [
    'https://example.com',
    'https://example.org',
    'https://example.net'
  ]

  // Auto-refresh status when jobId exists
  useEffect(() => {
    if (!jobId) return
    
    setIsPolling(true)
    const interval = setInterval(checkStatus, 2000) // Check every 2 seconds
    
    return () => {
      clearInterval(interval)
      setIsPolling(false)
    }
  }, [jobId])

  const startBatch = async () => {
    try {
      setError(null)
      setStatus(null)
      console.log('Starting batch with config:', {
        urls: testUrls,
        config: {
          deviceConfig: 'desktop',
          delay: 1000
        }
      })

      const response = await fetch('/api/screenshot/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: testUrls,
          config: {
            deviceConfig: 'desktop',
            delay: 1000
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start batch')
      }

      const data = await response.json()
      console.log('Batch started:', data)
      setJobId(data.jobId)
    } catch (err) {
      console.error('Batch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start batch')
    }
  }

  const checkStatus = async () => {
    if (!jobId) return
    try {
      setError(null)
      const response = await fetch(`/api/screenshot/batch?jobId=${jobId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check status')
      }
      const data = await response.json()
      console.log('Status:', data)
      setStatus(data)
      
      // Stop polling if job is completed or failed
      if (data.status === 'completed' || data.status === 'failed') {
        setIsPolling(false)
        setJobId(null)
      }
    } catch (err) {
      console.error('Status check error:', err)
      setError(err instanceof Error ? err.message : 'Failed to check status')
      setIsPolling(false)
    }
  }

  const cancelJob = async () => {
    if (!jobId) return
    try {
      setError(null)
      const response = await fetch(`/api/screenshot/batch?jobId=${jobId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel job')
      }
      setStatus(prev => prev ? { ...prev, status: 'cancelled' } : null)
      setJobId(null)
      setIsPolling(false)
    } catch (err) {
      console.error('Cancel error:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel job')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="space-x-2">
        <Button onClick={startBatch} disabled={isPolling}>Start Batch</Button>
        <Button onClick={checkStatus} disabled={!jobId || isPolling}>
          {isPolling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            'Check Status'
          )}
        </Button>
        <Button onClick={cancelJob} disabled={!jobId}>Cancel Job</Button>
      </div>
      
      {jobId && (
        <div className="text-sm">
          <p>Job ID: {jobId}</p>
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-500">
          Error: {error}
        </div>
      )}
      
      {status && (
        <div className="space-y-2">
          <div className="text-sm">
            Status: <span className="font-semibold">{status.status}</span>
            {status.progress !== undefined && (
              <> • Progress: <span className="font-semibold">{Math.round(status.progress * 100)}%</span></>
            )}
          </div>
          <pre className="bg-gray-100 p-4 rounded text-sm">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
} 