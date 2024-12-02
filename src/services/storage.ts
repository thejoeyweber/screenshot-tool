/**
 * Storage service
 * Handles local storage operations for screenshots and settings
 */
import type { Screenshot } from '@/types/screenshot'

const STORAGE_KEYS = {
  SCREENSHOTS: 'screenshots',
  SETTINGS: 'settings',
} as const

export async function saveToStorage<T>(key: string, data: T): Promise<void> {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving to storage:', error)
    throw error
  }
}

export async function loadFromStorage<T>(key: string): Promise<T | null> {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Error loading from storage:', error)
    throw error
  }
}

export async function removeFromStorage(key: string): Promise<void> {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing from storage:', error)
    throw error
  }
} 