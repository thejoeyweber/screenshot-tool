'use client'

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SetupPage() {
  const [saveProject, setSaveProject] = useState(false);

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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your screenshot project"
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select defaultValue="default">
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
          <Button onClick={() => window.location.href = "/config"}>
            Continue to Configuration
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
} 