/**
 * URL Input Form Component
 * 
 * Purpose: Main form for URL input and validation
 * Functionality: Handles URL input, validation, and submission
 * Relationships: Uses UrlValidation component and url-validation service
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UrlValidation } from "./UrlValidation"
import { validateUrl, checkUrlAccessibility, type ValidationResult } from "@/services/url-validation"

export function UrlForm() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Initial validation
    const result = validateUrl(url)
    setValidationResult(result)
    
    if (!result.isValid) return
    
    // Check accessibility
    setIsChecking(true)
    try {
      const accessResult = await checkUrlAccessibility(result.normalizedUrl!)
      setValidationResult(accessResult)
      
      if (accessResult.isValid) {
        // Create the full URL for the sitemap page
        const sitemapUrl = new URL("/sitemap", window.location.origin)
        sitemapUrl.searchParams.set("url", result.normalizedUrl!)
        
        // Navigate to sitemap page
        router.push(sitemapUrl.pathname + sitemapUrl.search)
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: "Failed to check URL accessibility"
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