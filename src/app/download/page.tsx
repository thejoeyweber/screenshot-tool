/**
 * Download Page
 * 
 * Purpose: Download screenshots in various formats
 * Functionality: Export as PDF, ZIP, or individual files
 */

'use client'

import { useState, useEffect } from "react"
import { useRouter, ReadonlyURLSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  Download,
  FileDown,
  ImageIcon,
  FileText,
  File,
  Share2,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useUrlSession } from "@/hooks/useUrlSession"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Image from 'next/image'
import { SearchParamsProvider } from "@/components/providers/SearchParamsProvider"

interface DownloadPageContentProps {
  searchParams: ReadonlyURLSearchParams
}

function DownloadPageContent({ searchParams }: DownloadPageContentProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { getSession } = useUrlSession()
  
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'pdf' | 'zip' | null>(null)
  const [metadata, setMetadata] = useState({
    title: '',
    totalPages: 0,
    pdfSize: '0 MB',
    zipSize: '0 MB',
    created: new Date()
  })

  // Load session data
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

    if (!session.results?.screenshots?.length) {
      toast({
        title: "Error",
        description: "No screenshots found in session",
        variant: "destructive"
      })
      router.push('/')
      return
    }

    // Get the storage session ID from the first screenshot
    const storageSessionId = session.results.screenshots[0].metadata?.sessionId
    if (!storageSessionId) {
      toast({
        title: "Error",
        description: "No storage session found",
        variant: "destructive"
      })
      router.push('/')
      return
    }

    setSessionId(storageSessionId)
    setMetadata({
      title: session.metadata?.name || 'Website Screenshots',
      totalPages: session.results.screenshots.length,
      pdfSize: '~5 MB',
      zipSize: '~20 MB',
      created: new Date()
    })
    setLoading(false)
  }, [searchParams, getSession, router, toast])

  const handleExport = async (format: 'pdf' | 'zip') => {
    if (!sessionId) return
    
    setExporting(format)
    try {
      const response = await fetch(`/api/export?format=${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          options: {
            metadata: true
          }
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }
      
      const blob = await response.blob()
      const disposition = response.headers.get('Content-Disposition')
      let filename = `screenshots.${format}`
      
      // Try to get filename from Content-Disposition
      if (disposition) {
        const matches = /filename="(.+)"/.exec(disposition)
        if (matches?.[1]) {
          filename = matches[1]
        }
      }
      
      // Download the file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Success",
        description: `Screenshots exported as ${format.toUpperCase()}`,
      })
    } catch (err) {
      toast({
        title: "Export Failed",
        description: err instanceof Error ? err.message : 'Failed to export screenshots',
        variant: "destructive"
      })
    } finally {
      setExporting(null)
    }
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
        className="w-full max-w-3xl space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Download Screenshots</h1>
          <p className="text-muted-foreground">
            Your screenshots are ready! Choose your preferred download format.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Compiled PDF</h2>
                  <p className="text-sm text-muted-foreground">
                    All screenshots in a single PDF file
                  </p>
                </div>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleExport('pdf')}
                disabled={exporting === 'pdf'}
              >
                {exporting === 'pdf' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                Download PDF
              </Button>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <File className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Individual Files</h2>
                  <p className="text-sm text-muted-foreground">
                    ZIP archive with all screenshots
                  </p>
                </div>
              </div>
              <Button 
                className="w-full" 
                size="lg" 
                variant="outline"
                onClick={() => handleExport('zip')}
                disabled={exporting === 'zip'}
              >
                {exporting === 'zip' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download ZIP
              </Button>
            </Card>
          </motion.div>
        </div>

        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Project Summary</h2>
            <Button variant="outline" size="sm" disabled>
              <Share2 className="mr-2 h-4 w-4" />
              Share Project
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Detail</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Project Name</TableCell>
                <TableCell>{metadata.title}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Pages</TableCell>
                <TableCell>{metadata.totalPages}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>PDF Size</TableCell>
                <TableCell>{metadata.pdfSize}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>ZIP Size</TableCell>
                <TableCell>{metadata.zipSize}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Created</TableCell>
                <TableCell>{metadata.created.toLocaleDateString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-1">
              <p className="font-medium">Need the source files?</p>
              <p className="text-sm text-muted-foreground">
                Download the original screenshots in full resolution
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={() => handleExport('zip')}
              disabled={exporting === 'zip'}
            >
              {exporting === 'zip' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="mr-2 h-4 w-4" />
              )}
              Download Originals
            </Button>
          </div>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Customization
          </Button>
          <Button onClick={() => router.push('/')}>
            Start New Project
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function DownloadPage() {
  return (
    <SearchParamsProvider>
      {(searchParams) => {
        return <DownloadPageContent searchParams={searchParams} />
      }}
    </SearchParamsProvider>
  )
} 