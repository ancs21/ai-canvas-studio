'use client'

import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Card } from '@/components/ui/card'

interface ImagePreviewProps {
  imageUrl: string
  prompt: string
  aspectRatio: string
}

const aspectRatioMap = {
  '1:1': 1,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
}

export function ImagePreview({ imageUrl, prompt, aspectRatio }: ImagePreviewProps) {
  const ratio = aspectRatioMap[aspectRatio as keyof typeof aspectRatioMap] || 1

  // Don't render if no image URL
  if (!imageUrl) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium">No Image</h4>
        <Card className="overflow-hidden">
          <AspectRatio ratio={ratio} className="bg-muted flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No image available</p>
          </AspectRatio>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Generated Image</h4>
      <Card className="overflow-hidden">
        <AspectRatio ratio={ratio} className="bg-muted">
          <img
            src={imageUrl}
            alt={prompt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </AspectRatio>
      </Card>
      <p className="text-xs text-muted-foreground line-clamp-2">{prompt}</p>
    </div>
  )
}