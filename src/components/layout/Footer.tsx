/**
 * Footer component
 * Contains status information and secondary controls
 */
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-12 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-full flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/help" className="hover:text-foreground transition-colors">
            Help & Support
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <span>Version 1.0.0</span>
        </div>
      </div>
    </footer>
  );
} 