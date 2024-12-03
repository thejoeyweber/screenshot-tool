/**
 * URL Validation Service
 * 
 * Purpose: Provides URL validation and processing functions
 * Functionality: Validates URLs, checks for protocol, ensures proper formatting
 * Relationships: Used by URL input components and sitemap processing
 */

// More permissive URL regex that allows common domain formats
const URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?$/;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
}

/**
 * Validates and normalizes a URL
 * Ensures proper formatting and protocol
 */
export function validateUrl(url: string): ValidationResult {
  if (!url) {
    return {
      isValid: false,
      error: "URL is required"
    };
  }

  // Trim whitespace
  url = url.trim();

  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Check URL format
  if (!URL_REGEX.test(url)) {
    return {
      isValid: false,
      error: "Invalid URL format"
    };
  }

  try {
    // Try to construct URL object (will throw if invalid)
    const urlObj = new URL(url);

    return {
      isValid: true,
      normalizedUrl: urlObj.href // Use href to get properly formatted URL
    };
  } catch (error) {
    return {
      isValid: false,
      error: "Invalid URL structure"
    };
  }
}

/**
 * Extracts domain from a URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * Checks if URL is accessible
 * Note: This is a basic check, might need to be enhanced based on requirements
 */
export async function checkUrlAccessibility(url: string): Promise<ValidationResult> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors'
    });
    
    return {
      isValid: true,
      normalizedUrl: url
    };
  } catch (error) {
    return {
      isValid: false,
      error: "URL is not accessible"
    };
  }
} 