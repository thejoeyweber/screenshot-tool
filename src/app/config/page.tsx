'use client'

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Monitor, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

function DeviceSelector() {
  return (
    <div className="flex gap-2">
      <Button variant="outline" className="flex-1">
        <Monitor className="mr-2 h-4 w-4" />
        Desktop
      </Button>
      <Button variant="outline" className="flex-1">
        <Tablet className="mr-2 h-4 w-4" />
        Tablet
      </Button>
      <Button variant="outline" className="flex-1">
        <Smartphone className="mr-2 h-4 w-4" />
        Mobile
      </Button>
    </div>
  );
}

function SettingsForm() {
  return (
    <div className="space-y-6">
      <DeviceSelector />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Screen Size</Label>
          <Select defaultValue="1920x1080">
            <SelectTrigger>
              <SelectValue placeholder="Select screen size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1920x1080">1920x1080 (Full HD)</SelectItem>
              <SelectItem value="2560x1440">2560x1440 (2K)</SelectItem>
              <SelectItem value="3840x2160">3840x2160 (4K)</SelectItem>
              <SelectItem value="custom">Custom Size</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Capture Delay (seconds)</Label>
          <Slider
            defaultValue={[2]}
            max={10}
            step={0.5}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label>Scroll Behavior</Label>
          <Select defaultValue="smooth">
            <SelectTrigger>
              <SelectValue placeholder="Select scroll behavior" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="smooth">Smooth Scroll</SelectItem>
              <SelectItem value="instant">Instant</SelectItem>
              <SelectItem value="auto">Auto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Hide Cookie Banners</Label>
            <p className="text-sm text-muted-foreground">
              Automatically hide common cookie consent banners
            </p>
          </div>
          <Switch defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Full Page Capture</Label>
            <p className="text-sm text-muted-foreground">
              Capture entire scrollable content
            </p>
          </div>
          <Switch defaultChecked />
        </div>
      </div>
    </div>
  );
}

export default function ConfigPage() {
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
              <SettingsForm />
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
                <SettingsForm />
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
                <SettingsForm />
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button onClick={() => window.location.href = "/generate"}>
            Start Capture
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
} 