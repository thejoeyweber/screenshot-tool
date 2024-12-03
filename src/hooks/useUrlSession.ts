/**
 * URL Session Hook
 * 
 * Purpose: Manages URL sessions in browser storage
 * Functionality: Store, retrieve, and validate URL sessions
 * Relationships: Used by sitemap and setup pages
 */

import { useCallback } from 'react'

const STORAGE_KEY_PREFIX = 'screenshot_urls_'
const SESSION_TIMEOUT = 1000 * 60 * 60 // 1 hour

export interface UrlSession {
  baseUrl: string
  urls: string[]
  timestamp: number
}

export function useUrlSession() {
  const getSession = useCallback((sessionId: string): UrlSession | null => {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${sessionId}`
      const sessionData = sessionStorage.getItem(storageKey)
      
      if (!sessionData) {
        return null
      }

      const session: UrlSession = JSON.parse(sessionData)
      
      // Check if session has expired
      if (Date.now() - session.timestamp > SESSION_TIMEOUT) {
        sessionStorage.removeItem(storageKey)
        return null
      }

      return session
    } catch (error) {
      console.error('Error retrieving session:', error)
      return null
    }
  }, [])

  const createSession = useCallback((baseUrl: string, urls: string[]): string => {
    const sessionId = crypto.randomUUID()
    const storageKey = `${STORAGE_KEY_PREFIX}${sessionId}`
    
    const session: UrlSession = {
      baseUrl,
      urls,
      timestamp: Date.now()
    }

    sessionStorage.setItem(storageKey, JSON.stringify(session))
    return sessionId
  }, [])

  const deleteSession = useCallback((sessionId: string): void => {
    const storageKey = `${STORAGE_KEY_PREFIX}${sessionId}`
    sessionStorage.removeItem(storageKey)
  }, [])

  const updateSession = useCallback((sessionId: string, updates: Partial<UrlSession>): boolean => {
    try {
      const session = getSession(sessionId)
      if (!session) return false

      const updatedSession = {
        ...session,
        ...updates,
        timestamp: Date.now() // Reset timeout on update
      }

      const storageKey = `${STORAGE_KEY_PREFIX}${sessionId}`
      sessionStorage.setItem(storageKey, JSON.stringify(updatedSession))
      return true
    } catch (error) {
      console.error('Error updating session:', error)
      return false
    }
  }, [getSession])

  return {
    getSession,
    createSession,
    deleteSession,
    updateSession
  }
} 