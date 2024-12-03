'use client'

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, GripVertical, Image as ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Screenshot {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
}

// Example data - replace with real screenshots
const sampleScreenshots: Screenshot[] = [
  {
    id: "1",
    url: "/",
    title: "Homepage",
    thumbnail: "/placeholder.jpg",
  },
  {
    id: "2",
    url: "/products",
    title: "Products",
    thumbnail: "/placeholder.jpg",
  },
  {
    id: "3",
    url: "/about",
    title: "About",
    thumbnail: "/placeholder.jpg",
  },
];

export default function CustomizePage() {
  const [screenshots, setScreenshots] = useState(sampleScreenshots);

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
                    {screenshots.map((screenshot) => (
                      <Card
                        key={screenshot.id}
                        className="p-4 cursor-move hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                          <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{screenshot.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {screenshot.url}
                            </p>
                          </div>
                          <Select defaultValue="include">
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="include">Include</SelectItem>
                              <SelectItem value="exclude">Exclude</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">PDF Preview</p>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cover Title</Label>
                <Input defaultValue="Website Screenshots" />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
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
                <Select defaultValue="modern">
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
          <Button onClick={() => window.location.href = "/download"}>
            Continue to Download
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
} 