import { DeviceConfig } from '@/types/screenshot'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Monitor, Tablet, Smartphone } from 'lucide-react'
import { deviceConfigs } from '@/config/devices'

interface CaptureSettingsProps {
  device: DeviceConfig
  delay: number
  onDeviceChange: (device: DeviceConfig) => void
  onDelayChange: (delay: number) => void
  className?: string
}

export function CaptureSettings({
  device,
  delay,
  onDeviceChange,
  onDelayChange,
  className = ''
}: CaptureSettingsProps) {
  const deviceIcons = {
    Desktop: Monitor,
    Tablet: Tablet,
    Mobile: Smartphone
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label>Device</Label>
        <Select
          value={device.name}
          onValueChange={(value) => {
            const config = Object.values(deviceConfigs).find(d => d.name === value)
            if (config) onDeviceChange(config)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select device" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(deviceConfigs).map((config) => {
              const Icon = deviceIcons[config.name as keyof typeof deviceIcons]
              return (
                <SelectItem key={config.name} value={config.name}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{config.name}</span>
                    <span className="text-muted-foreground ml-2">
                      {config.width}x{config.height}
                    </span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Capture Delay</Label>
        <div className="flex items-center gap-4">
          <Slider
            value={[delay]}
            onValueChange={([value]) => onDelayChange(value)}
            min={100}
            max={5000}
            step={100}
            className="flex-1"
          />
          <Input
            type="number"
            value={delay}
            onChange={(e) => onDelayChange(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">ms</span>
        </div>
      </div>
    </div>
  )
} 