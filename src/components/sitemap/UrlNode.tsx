/**
 * URL Node Component
 * 
 * Purpose: Displays individual URL in the sitemap tree
 * Functionality: Shows URL details and selection state
 * Relationships: Used by UrlTree component
 */

import { Checkbox } from "@/components/ui/checkbox"
import { SitemapUrl } from "@/services/sitemap"
import { formatDistanceToNow } from "date-fns"

interface UrlNodeProps {
  url: SitemapUrl
  isSelected: boolean
  onToggle: (url: SitemapUrl) => void
}

export function UrlNode({ url, isSelected, onToggle }: UrlNodeProps) {
  const urlObj = new URL(url.loc)
  const lastModified = url.lastmod ? new Date(url.lastmod) : null

  return (
    <div className="flex items-center space-x-2 py-1">
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(url)}
        id={url.loc}
      />
      <div className="flex-1 min-w-0">
        <label
          htmlFor={url.loc}
          className="text-sm cursor-pointer flex items-center justify-between"
        >
          <span className="truncate">{urlObj.pathname || '/'}</span>
          {lastModified && (
            <span className="text-xs text-muted-foreground ml-2">
              {formatDistanceToNow(lastModified, { addSuffix: true })}
            </span>
          )}
        </label>
      </div>
    </div>
  )
} 