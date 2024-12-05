/**
 * Configuration Page
 * 
 * Purpose: Configure screenshot capture settings
 * Functionality: Device selection, capture options, session management
 */

'use client'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ChevronRight, Monitor, Smartphone, Tablet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useUrlSession } from "@/hooks/useUrlSession"
import { deviceConfigs, type DeviceName } from "@/config/devices"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

interface DeviceSelectorProps {
  value: DeviceName
  onChange: (device: DeviceName) => void
}

function DeviceSelector({ value, onChange }: DeviceSelectorProps) {
  return (
    <div className="flex gap-2">
      <Button 
        variant={value === 'desktop' ? 'default' : 'outline'} 
        className="flex-1"
        onClick={() => onChange('desktop')}
      >
        <Monitor className="mr-2 h-4 w-4" />
        Desktop
      </Button>
      <Button 
        variant={value === 'tablet' ? 'default' : 'outline'} 
        className="flex-1"
        onClick={() => onChange('tablet')}
      >
        <Tablet className="mr-2 h-4 w-4" />
        Tablet
      </Button>
      <Button 
        variant={value === 'mobile' ? 'default' : 'outline'} 
        className="flex-1"
        onClick={() => onChange('mobile')}
      >
        <Smartphone className="mr-2 h-4 w-4" />
        Mobile
      </Button>
    </div>
  )
}

interface SettingsFormProps {
  device: DeviceName
  onDeviceChange: (device: DeviceName) => void
  delay: number
  onDelayChange: (delay: number) => void
  hideCookieBanners: boolean
  onHideCookieBannersChange: (hide: boolean) => void
  fullPage: boolean
  onFullPageChange: (full: boolean) => void
}

function SettingsForm({
  device,
  onDeviceChange,
  delay,
  onDelayChange,
  hideCookieBanners,
  onHideCookieBannersChange,
  fullPage,
  onFullPageChange
}: SettingsFormProps) {
  const config = deviceConfigs[device]
  
  return (
    <div className="space-y-6">
      <DeviceSelector value={device} onChange={onDeviceChange} />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Screen Size</Label>
          <div className="text-sm text-muted-foreground">
            {config.width}x{config.height} ({config.name})
          </div>
        </div>

        <div className="space-y-2">
          <Label>Capture Delay (seconds)</Label>
          <Slider
            value={[delay / 1000]} // Convert ms to seconds
            onValueChange={([value]) => onDelayChange(value * 1000)}
            max={10}
            step={0.5}
            className="w-full"
          />
          <div className="text-sm text-muted-foreground">
            {(delay / 1000).toFixed(1)} seconds
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Hide Cookie Banners</Label>
            <p className="text-sm text-muted-foreground">
              Automatically hide common cookie consent banners
            </p>
          </div>
          <Switch 
            checked={hideCookieBanners}
            onCheckedChange={onHideCookieBannersChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Full Page Capture</Label>
            <p className="text-sm text-muted-foreground">
              Capture entire scrollable content
            </p>
          </div>
          <Switch 
            checked={fullPage}
            onCheckedChange={onFullPageChange}
          />
        </div>
      </div>
    </div>
  )
}

export default function ConfigPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { getSession, updateSession } = useUrlSession()
  
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Configuration state
  const [device, setDevice] = useState<DeviceName>('desktop')
  const [delay, setDelay] = useState(2000) // 2 seconds
  const [hideCookieBanners, setHideCookieBanners] = useState(true)
  const [fullPage, setFullPage] = useState(true)

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

    // Load existing config if any
    if (session.config) {
      setDevice((session.config.deviceConfig as DeviceName) || 'desktop')
      setDelay(session.config.delay || 2000)
      setHideCookieBanners(session.config.hideSelectors?.includes('.cookie-banner') || true)
      // Full page is always true for now
    }

    setSessionId(sid)
    setLoading(false)
  }, [searchParams, getSession, router, toast])

  // Auto-save on config changes
  useEffect(() => {
    if (!sessionId) return

    const saveTimeout = setTimeout(() => {
      updateSession(sessionId, {
        config: {
          deviceConfig: device,
          delay,
          hideSelectors: hideCookieBanners ? ['.cookie-banner', '.cookie-consent', '#cookie-notice'] : [],
          maxDimension: 10000,
          quality: 90,
          maxFileSize: 10 * 1024 * 1024
        }
      })
    }, 500) // Debounce saves

    return () => clearTimeout(saveTimeout)
  }, [sessionId, device, delay, hideCookieBanners, updateSession])

  const handleContinue = () => {
    if (!sessionId) return
    router.push(`/generate?session=${sessionId}`)
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
          <h1 className="text-2xl font-bold">Configuration Settings</h1>
          <p className="text-muted-foreground">
            Customize how your screenshots will be captured.
          </p>
        </div>

        <Card className="p-6">
          <Tabs defaultValue="global" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="global">Global</TabsTrigger>
              <TabsTrigger value="section">Section</TabsTrigger>
              <TabsTrigger value="page">Page</TabsTrigger>
            </TabsList>

            <TabsContent value="global" className="space-y-4">
              <SettingsForm 
                device={device}
                onDeviceChange={setDevice}
                delay={delay}
                onDelayChange={setDelay}
                hideCookieBanners={hideCookieBanners}
                onHideCookieBannersChange={setHideCookieBanners}
                fullPage={fullPage}
                onFullPageChange={setFullPage}
              />
            </TabsContent>

            <TabsContent value="section" className="space-y-4">
              <div className="space-y-4">
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="about">About</SelectItem>
                  </SelectContent>
                </Select>
                <SettingsForm 
                  device={device}
                  onDeviceChange={setDevice}
                  delay={delay}
                  onDelayChange={setDelay}
                  hideCookieBanners={hideCookieBanners}
                  onHideCookieBannersChange={setHideCookieBanners}
                  fullPage={fullPage}
                  onFullPageChange={setFullPage}
                />
              </div>
            </TabsContent>

            <TabsContent value="page" className="space-y-4">
              <div className="space-y-4">
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Select page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pages</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="about">About</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                  </SelectContent>
                </Select>
                <SettingsForm 
                  device={device}
                  onDeviceChange={setDevice}
                  delay={delay}
                  onDelayChange={setDelay}
                  hideCookieBanners={hideCookieBanners}
                  onHideCookieBannersChange={setHideCookieBanners}
                  fullPage={fullPage}
                  onFullPageChange={setFullPage}
                />
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button onClick={handleContinue}>
            Start Capture
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
} 