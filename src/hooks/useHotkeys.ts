/**
 * Hotkeys hook
 * Manages keyboard shortcuts for the application
 */
import { useEffect } from 'react'

type HotkeyHandler = (e: KeyboardEvent) => void
type HotkeyMap = Record<string, HotkeyHandler>

export function useHotkeys(hotkeys: HotkeyMap) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const key = [
        e.ctrlKey && 'Ctrl',
        e.shiftKey && 'Shift',
        e.altKey && 'Alt',
        e.key.toLowerCase()
      ].filter(Boolean).join('+')

      const handler = hotkeys[key]
      if (handler) {
        e.preventDefault()
        handler(e)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hotkeys])
} 