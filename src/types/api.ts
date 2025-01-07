/**
 * API Types
 * 
 * Shared types for API requests and responses
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
}

// Extend ValidationResult with additional URL-specific fields if needed
export interface UrlValidationResponse extends ValidationResult {
  urlType?: 'http' | 'https' | 'relative';
  baseUrl?: string;
}

export interface SitemapResponse {
  sitemapUrls: string[];
  robotsTxtContent?: string;
  error?: string;
  mode?: 'primary' | 'secondary' | 'extended';
  hasMoreOptions?: boolean;
} 