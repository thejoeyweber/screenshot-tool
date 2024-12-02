/**
 * Screenshot Store
 * Global state management for screenshots using Zustand
 */
import { create } from 'zustand'
import type { Screenshot } from '@/types/screenshot'

interface ScreenshotState {
  screenshots: Screenshot[]
  activeScreenshot: Screenshot | null
  setActiveScreenshot: (screenshot: Screenshot | null) => void
  addScreenshot: (screenshot: Screenshot) => void
}

export const useScreenshotStore = create<ScreenshotState>()((set) => ({
  screenshots: [],
  activeScreenshot: null,
  setActiveScreenshot: (screenshot) => set({ activeScreenshot: screenshot }),
  addScreenshot: (screenshot) => 
    set((state) => ({ screenshots: [...state.screenshots, screenshot] })),
})) 