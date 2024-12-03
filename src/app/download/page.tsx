'use client'

import { motion } from "framer-motion";
import {
  Download,
  FileDown,
  Image,
  FileText,
  File,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DownloadPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div
        className="w-full max-w-3xl space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Download Screenshots</h1>
          <p className="text-muted-foreground">
            Your screenshots are ready! Choose your preferred download format.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Compiled PDF</h2>
                  <p className="text-sm text-muted-foreground">
                    All screenshots in a single PDF file
                  </p>
                </div>
              </div>
              <Button className="w-full" size="lg">
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <File className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Individual Files</h2>
                  <p className="text-sm text-muted-foreground">
                    ZIP archive with all screenshots
                  </p>
                </div>
              </div>
              <Button className="w-full" size="lg" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download ZIP
              </Button>
            </Card>
          </motion.div>
        </div>

        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Project Summary</h2>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share Project
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Detail</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Project Name</TableCell>
                <TableCell>My Website Screenshots</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total Pages</TableCell>
                <TableCell>15</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>PDF Size</TableCell>
                <TableCell>12.4 MB</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>ZIP Size</TableCell>
                <TableCell>45.8 MB</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Created</TableCell>
                <TableCell>December 3, 2024</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-1">
              <p className="font-medium">Need the source files?</p>
              <p className="text-sm text-muted-foreground">
                Download the original screenshots in full resolution
              </p>
            </div>
            <Button variant="outline">
              <Image className="mr-2 h-4 w-4" />
              Download Originals
            </Button>
          </div>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Customization
          </Button>
          <Button onClick={() => window.location.href = "/dashboard"}>
            Go to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
} 