/**
 * Color picker component
 * Allows selecting colors for annotations
 */
'use client'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2">
      {/* Color swatches will be added here */}
    </div>
  )
} 