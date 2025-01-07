/**
 * Setup Page
 * 
 * Purpose: Project setup and metadata configuration
 * Functionality: Reads session from URL, allows project configuration
 */

'use client'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, ReadonlyURLSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useUrlSession } from "@/hooks/useUrlSession"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchParamsProvider } from "@/components/providers/SearchParamsProvider"

interface SetupPageContentProps {
  searchParams: ReadonlyURLSearchParams
}

function SetupPageContent({ searchParams }: SetupPageContentProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { getSession, updateSession } = useUrlSession()
  
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [template, setTemplate] = useState("default")
  const [saveProject, setSaveProject] = useState(false)

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

    setSessionId(sid)

    // Load existing metadata if any
    if (session.metadata) {
      setName(session.metadata.name)
      setDescription(session.metadata.description || '')
      setTemplate(session.metadata.template)
      setSaveProject(session.metadata.saveProject)
    }

    setLoading(false)
  }, [searchParams, getSession, router, toast])

  // Auto-save on form changes
  useEffect(() => {
    if (!sessionId) return

    const saveTimeout = setTimeout(() => {
      updateSession(sessionId, {
        metadata: {
          name: name || 'Untitled Project',
          description,
          template,
          saveProject
        }
      })
    }, 500) // Debounce saves

    return () => clearTimeout(saveTimeout)
  }, [sessionId, name, description, template, saveProject, updateSession])

  const handleContinue = () => {
    if (!sessionId) return
    router.push(`/config?session=${sessionId}`)
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
          <h1 className="text-2xl font-bold">Project Setup</h1>
          <p className="text-muted-foreground">
            Configure your screenshot project settings.
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="My Website Screenshots"
                className="w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your screenshot project"
                className="resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="portfolio">Portfolio</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Save Project</Label>
                <p className="text-sm text-muted-foreground">
                  Save this project for later editing
                </p>
              </div>
              <Switch
                checked={saveProject}
                onCheckedChange={setSaveProject}
              />
            </div>
          </div>

          {saveProject && (
            <motion.div
              className="space-y-4 pt-4 border-t"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm text-muted-foreground">
                You'll need to log in or create an account to save your project.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" className="w-full" asChild>
                  <a href="/login">Log In</a>
                </Button>
                <Button className="w-full" asChild>
                  <a href="/register">Sign Up</a>
                </Button>
              </div>
            </motion.div>
          )}
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button onClick={handleContinue}>
            Continue to Configuration
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function SetupPage() {
  return (
    <SearchParamsProvider>
      {(searchParams) => {
        return <SetupPageContent searchParams={searchParams} />
      }}
    </SearchParamsProvider>
  )
} 