/**
 * URL Tree Component
 * 
 * Purpose: Displays hierarchical URL structure
 * Functionality: Groups URLs by section, handles selection
 * Relationships: Uses UrlNode component
 */

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight } from "lucide-react"
import { SitemapUrl } from "@/services/sitemap"
import { UrlNode } from "./UrlNode"

interface UrlTreeProps {
  urlGroups: Record<string, SitemapUrl[]>
  selectedUrls: Set<string>
  onUrlToggle: (url: SitemapUrl) => void
  onSelectAll: () => void
  onSelectNone: () => void
}

export function UrlTree({ 
  urlGroups, 
  selectedUrls, 
  onUrlToggle,
  onSelectAll,
  onSelectNone
}: UrlTreeProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['root']))
  
  const toggleSection = (section: string) => {
    const newOpenSections = new Set(openSections)
    if (newOpenSections.has(section)) {
      newOpenSections.delete(section)
    } else {
      newOpenSections.add(section)
    }
    setOpenSections(newOpenSections)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Available Pages</CardTitle>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSelectAll}
            >
              Select All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSelectNone}
            >
              Select None
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(urlGroups).map(([section, urls]) => (
          <Collapsible
            key={section}
            open={openSections.has(section)}
            onOpenChange={() => toggleSection(section)}
          >
            <CollapsibleTrigger className="flex items-center w-full text-left">
              <ChevronRight className={`h-4 w-4 transition-transform ${
                openSections.has(section) ? 'transform rotate-90' : ''
              }`} />
              <span className="ml-2 font-medium">
                {section === 'root' ? 'Main Pages' : section}
                <span className="text-muted-foreground ml-2 text-sm">
                  ({urls.length} {urls.length === 1 ? 'page' : 'pages'})
                </span>
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-6 mt-1">
              {urls.map(url => (
                <UrlNode
                  key={url.loc}
                  url={url}
                  isSelected={selectedUrls.has(url.loc)}
                  onToggle={onUrlToggle}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  )
} 