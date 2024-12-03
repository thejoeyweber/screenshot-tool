/**
 * URL Validation Component
 * 
 * Purpose: Displays URL validation status and error messages
 * Functionality: Shows validation feedback using shadcn components
 * Relationships: Used by UrlForm component
 */

import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle } from "lucide-react"
import type { ValidationResult } from "@/services/url-validation"

interface UrlValidationProps {
  result?: ValidationResult;
  isChecking?: boolean;
}

export function UrlValidation({ result, isChecking }: UrlValidationProps) {
  if (!result && !isChecking) return null;

  if (isChecking) {
    return (
      <Alert className="mt-2">
        <AlertDescription className="flex items-center text-muted-foreground">
          Checking URL...
        </AlertDescription>
      </Alert>
    );
  }

  if (!result?.isValid) {
    return (
      <Alert variant="destructive" className="mt-2">
        <XCircle className="h-4 w-4" />
        <AlertDescription className="ml-2">
          {result?.error || "Invalid URL"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mt-2 border-green-500/50 text-green-500">
      <CheckCircle2 className="h-4 w-4" />
      <AlertDescription className="ml-2">
        URL is valid
      </AlertDescription>
    </Alert>
  );
} 