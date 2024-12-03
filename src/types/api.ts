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

export interface UrlValidationResponse extends ValidationResult {}

export interface SitemapResponse {
  sitemapUrls: string[];
  robotsTxtContent?: string;
  error?: string;
} 