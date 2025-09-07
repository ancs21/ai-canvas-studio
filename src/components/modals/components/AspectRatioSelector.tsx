'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Square, RectangleHorizontal, RectangleVertical } from 'lucide-react'

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4'

interface AspectRatioSelectorProps {
  value: AspectRatio
  onChange: (value: AspectRatio) => void
  disabled?: boolean
}

const aspectRatios = [
  { value: '1:1', label: 'Square', icon: Square },
  { value: '16:9', label: 'Landscape', icon: RectangleHorizontal },
  { value: '9:16', label: 'Portrait', icon: RectangleVertical },
  { value: '4:3', label: 'Standard', icon: RectangleHorizontal },
  { value: '3:4', label: 'Vertical', icon: RectangleVertical },
] as const

export function AspectRatioSelector({
  value,
  onChange,
  disabled = false,
}: AspectRatioSelectorProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => {
        if (val) {
          onChange(val as AspectRatio)
        }
      }}
      disabled={disabled}
      className="justify-start gap-2"
    >
      {aspectRatios.map(({ value: ratio, label, icon: Icon }) => (
        <ToggleGroupItem
          key={ratio}
          value={ratio}
          aria-label={label}
          className="flex flex-col gap-1 h-auto py-2 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <Icon className="w-5 h-5" />
          <span className="text-xs">{ratio}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}