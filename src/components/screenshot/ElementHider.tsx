import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, X } from 'lucide-react'

interface ElementHiderProps {
  selectors: string[]
  onSelectorsChange: (selectors: string[]) => void
  className?: string
}

export function ElementHider({
  selectors,
  onSelectorsChange,
  className = ''
}: ElementHiderProps) {
  const [newSelector, setNewSelector] = useState('')

  const addSelector = () => {
    if (newSelector && !selectors.includes(newSelector)) {
      onSelectorsChange([...selectors, newSelector])
      setNewSelector('')
    }
  }

  const removeSelector = (selector: string) => {
    onSelectorsChange(selectors.filter(s => s !== selector))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label>Hide Elements (CSS Selectors)</Label>
        <div className="flex gap-2">
          <Input
            value={newSelector}
            onChange={(e) => setNewSelector(e.target.value)}
            placeholder=".cookie-banner, #popup"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSelector()
              }
            }}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={addSelector}
            disabled={!newSelector}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectors.map((selector) => (
            <Badge
              key={selector}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {selector}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeSelector(selector)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
} 