/**
 * URL Input Form Component
 * 
 * Purpose: Main form for URL input and validation
 * Functionality: Handles URL input, validation, and submission
 * Relationships: Uses UrlValidation component and api-client service
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UrlValidation } from "./UrlValidation"
import { validateUrl as validateUrlFormat } from "@/services/url-validation"
import { validateUrl } from "@/services/api-client"
import type { ValidationResult } from "@/types/api"

export function UrlForm() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Initial format validation
    const formatResult = validateUrlFormat(url)
    if (!formatResult.isValid) {
      setValidationResult(formatResult)
      return
    }
    
    // Check accessibility and fetch sitemaps
    setIsChecking(true)
    try {
      const validationResult = await validateUrl(formatResult.normalizedUrl!)
      
      if (validationResult.isValid) {
        // Create the full URL for the sitemap page with all our data
        const sitemapUrl = new URL("/sitemap", window.location.origin)
        sitemapUrl.searchParams.set("url", validationResult.normalizedUrl!)
        
        // Navigate to sitemap page
        router.push(sitemapUrl.pathname + sitemapUrl.search)
      } else {
        setValidationResult(validationResult)
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: error instanceof Error ? error.message : "Failed to validate URL"
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Create Website Submission Files</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter your website url (e.g. https://example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isChecking}>
              {isChecking ? "Checking..." : "Continue"}
            </Button>
          </div>
          <UrlValidation 
            result={validationResult}
            isChecking={isChecking}
          />
        </form>
      </CardContent>
    </Card>
  )
} 