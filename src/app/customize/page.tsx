/**
 * Customize Page
 * 
 * Purpose: Customize PDF output and screenshot order
 * Functionality: Reorder screenshots, customize PDF metadata
 */

'use client'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ChevronRight, GripVertical, Image as ImageIcon, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useUrlSession } from "@/hooks/useUrlSession"
import type { Screenshot } from "@/types/screenshot"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImagePreview } from '@/components/screenshot/ImagePreview'
import { ChevronLeft } from 'lucide-react'

export default function CustomizePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { getSession, updateSession } = useUrlSession()
  
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [order, setOrder] = useState<string[]>([])
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    template: 'modern'
  })
  const [previewIndex, setPreviewIndex] = useState(0)

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

    setSessionId(sid)
    setScreenshots(session.results.screenshots)
    setOrder(session.results.order || session.results.screenshots.map(s => s.id))
    
    // Load metadata if exists
    if (session.metadata) {
      setMetadata({
        title: session.metadata.name || '',
        description: session.metadata.description || '',
        template: session.metadata.template || 'modern'
      })
    }
    
    setLoading(false)
  }, [searchParams, getSession, router, toast])

  const handleReorder = (draggedId: string, targetId: string) => {
    const newOrder = [...order]
    const draggedIndex = newOrder.indexOf(draggedId)
    const targetIndex = newOrder.indexOf(targetId)
    
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedId)
    
    setOrder(newOrder)
    
    // Update session
    if (sessionId) {
      updateSession(sessionId, {
        results: {
          screenshots,
          order: newOrder,
          annotations: {}
        }
      })
    }
  }

  const handleMetadataChange = (
    key: keyof typeof metadata,
    value: string
  ) => {
    const newMetadata = { ...metadata, [key]: value }
    setMetadata(newMetadata)
    
    // Update session
    if (sessionId) {
      updateSession(sessionId, {
        metadata: {
          name: newMetadata.title,
          description: newMetadata.description,
          template: newMetadata.template,
          saveProject: false
        }
      })
    }
  }

  const handleContinue = () => {
    if (!sessionId) return
    router.push(`/download?session=${sessionId}`)
  }

  const handleNextPreview = () => {
    setPreviewIndex(prev => Math.min(prev + 1, order.length - 1))
  }

  const handlePrevPreview = () => {
    setPreviewIndex(prev => Math.max(prev - 1, 0))
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
        className="w-full max-w-4xl space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Customize PDF Output</h1>
          <p className="text-muted-foreground">
            Organize and brand your screenshot collection.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2 p-6 space-y-6">
            <Tabs defaultValue="organize" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="organize">Organize Pages</TabsTrigger>
                <TabsTrigger value="preview">PDF Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="organize" className="space-y-4">
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-2">
                    {order.map((id) => {
                      const screenshot = screenshots.find(s => s.id === id)
                      if (!screenshot) return null
                      
                      return (
                        <Card
                          key={screenshot.id}
                          className="p-4 cursor-move hover:bg-accent/50 transition-colors"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', screenshot.id)
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            const draggedId = e.dataTransfer.getData('text/plain')
                            handleReorder(draggedId, screenshot.id)
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                            <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                              {screenshot.imageData ? (
                                <img
                                  src={`data:image/jpeg;base64,${Buffer.from(screenshot.imageData).toString('base64')}`}
                                  alt={screenshot.title}
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{screenshot.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {screenshot.url}
                              </p>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="relative h-[500px]">
                  {screenshots.length > 0 && (
                    <>
                      <ImagePreview
                        screenshot={screenshots.find(s => s.id === order[previewIndex])!}
                        controls={{
                          zoom: true,
                          pan: true,
                          fullscreen: true
                        }}
                      />
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handlePrevPreview}
                          disabled={previewIndex <= 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                          Page {previewIndex + 1} of {order.length}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleNextPreview}
                          disabled={previewIndex >= order.length - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cover Title</Label>
                <Input 
                  value={metadata.title}
                  onChange={(e) => handleMetadataChange('title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={metadata.description}
                  onChange={(e) => handleMetadataChange('description', e.target.value)}
                  placeholder="Add a description for your PDF..."
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Button variant="outline" className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Template</Label>
                <Select 
                  value={metadata.template}
                  onValueChange={(value) => handleMetadataChange('template', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button onClick={handleContinue}>
            Continue to Download
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
} 