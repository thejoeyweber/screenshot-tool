'use client'

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronRight, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CaptureStatus {
  url: string;
  status: "pending" | "processing" | "success" | "error";
  message?: string;
}

// Example data - replace with real capture logic
const samplePages: CaptureStatus[] = [
  {
    url: "/",
    status: "success",
    message: "Captured successfully",
  },
  {
    url: "/products",
    status: "success",
    message: "Captured successfully",
  },
  {
    url: "/products/category-1",
    status: "error",
    message: "Failed to load page",
  },
  {
    url: "/about",
    status: "processing",
  },
  {
    url: "/contact",
    status: "pending",
  },
];

function StatusIcon({ status }: { status: CaptureStatus["status"] }) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "processing":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
}

export default function GeneratePage() {
  const [progress, setProgress] = useState(40);
  const completedPages = samplePages.filter(p => p.status === "success").length;
  const totalPages = samplePages.length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        className="w-full max-w-2xl space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Generating Screenshots</h1>
          <p className="text-muted-foreground">
            Capturing {completedPages} of {totalPages} pages...
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {samplePages.map((page) => (
                <div
                  key={page.url}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon status={page.status} />
                    <span className="text-sm">{page.url}</span>
                  </div>
                  {page.message && (
                    <span className="text-sm text-muted-foreground">
                      {page.message}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {samplePages.some(p => p.status === "error") && (
            <Alert variant="destructive">
              <AlertDescription>
                Some pages failed to capture. You can retry failed pages or continue with successful captures.
              </AlertDescription>
            </Alert>
          )}
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button onClick={() => window.location.href = "/customize"}>
            Continue to Customization
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
} 