'use client'

import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // TODO: Implement URL processing
    setTimeout(() => {
      window.location.href = "/sitemap";
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <motion.div
        className="text-center space-y-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold tracking-tight">
          Capture Your Website, Page by Page
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Generate beautiful, organized screenshots of your entire website with just one URL.
        </p>
      </motion.div>

      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="Enter your website URL (e.g., https://example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    Try it Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm">
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="font-medium">Automatic Sitemap</h3>
            <p className="text-muted-foreground">
              We'll scan your website and create a structured sitemap automatically.
            </p>
          </motion.div>
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h3 className="font-medium">Customizable Capture</h3>
            <p className="text-muted-foreground">
              Choose which pages to include and customize screenshot settings.
            </p>
          </motion.div>
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h3 className="font-medium">Organized Output</h3>
            <p className="text-muted-foreground">
              Get a beautifully formatted PDF with all your screenshots organized.
            </p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="mt-12 flex justify-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Button variant="outline" asChild>
          <a href="/login">Log In</a>
        </Button>
        <Button asChild>
          <a href="/register">Sign Up</a>
        </Button>
      </motion.div>
    </div>
  );
}
