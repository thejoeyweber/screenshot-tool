'use client'

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ChevronRight, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SitemapNode {
  url: string;
  title: string;
  children?: SitemapNode[];
}

// Example data - replace with real API call
const sampleSitemap: SitemapNode[] = [
  {
    url: "/",
    title: "Home",
  },
  {
    url: "/products",
    title: "Products",
    children: [
      { url: "/products/category-1", title: "Category 1" },
      { url: "/products/category-2", title: "Category 2" },
    ],
  },
  {
    url: "/about",
    title: "About",
    children: [
      { url: "/about/team", title: "Team" },
      { url: "/about/contact", title: "Contact" },
    ],
  },
];

function SitemapTree({ node, level = 0 }: { node: SitemapNode; level?: number }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isChecked, setIsChecked] = useState(true);

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="py-1">
      <div className="flex items-center gap-2">
        {hasChildren && (
          <CollapsibleTrigger
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-accent rounded-sm"
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
        )}
        {!hasChildren && <div className="w-6" />}
        <Checkbox
          checked={isChecked}
          onCheckedChange={(checked) => setIsChecked(checked as boolean)}
        />
        <span className="text-sm">{node.title}</span>
        <span className="text-xs text-muted-foreground">{node.url}</span>
      </div>
      {hasChildren && (
        <CollapsibleContent>
          <div className="ml-6 border-l pl-2">
            {node.children?.map((child) => (
              <SitemapTree key={child.url} node={child} level={level + 1} />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </div>
  );
}

export default function SitemapPage() {
  const [progress, setProgress] = useState(100);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        className="w-full max-w-3xl space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Site Structure</h1>
          <p className="text-muted-foreground">
            Select the pages you want to include in your screenshot collection.
          </p>
        </div>

        <Card className="p-6">
          {progress < 100 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing website structure...</span>
              </div>
              <Progress value={progress} />
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <Collapsible defaultOpen>
                {sampleSitemap.map((node) => (
                  <SitemapTree key={node.url} node={node} />
                ))}
              </Collapsible>
            </ScrollArea>
          )}
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button onClick={() => window.location.href = "/setup"}>
            Continue to Setup
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
} 