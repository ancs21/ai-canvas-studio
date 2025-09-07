'use client'

import { Button } from '@/components/ui/button'
import { 
  Sparkles,
  Edit3,
  Maximize,
  Plus,
  Minus,
  RotateCcw,
  RotateCw,
  Maximize2,
  Grid3x3,
  Download,
  MoreHorizontal
} from 'lucide-react'

interface ToolbarControlsProps {
  onGenerateImage: () => void
  onEditImage: () => void
  onUpscaleImage: () => void
  onDownloadImages: () => void
  hasSelectedImage: boolean
  selectedImageCount?: number
}

export function ToolbarControls({ 
  onGenerateImage, 
  onEditImage,
  onUpscaleImage,
  onDownloadImages,
  hasSelectedImage,
  selectedImageCount = 0
}: ToolbarControlsProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-sm flex items-center p-1 gap-1">
        {/* Main Actions */}
        <Button 
          size="icon"
          variant="ghost"
          onClick={onGenerateImage}
          className="h-8 w-8"
          title="Generate Image"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
        
        {hasSelectedImage && (
          <>
            <Button 
              size="icon"
              variant="ghost"
              onClick={onEditImage}
              className="h-8 w-8"
              title={`Edit Image${selectedImageCount > 1 ? ` (${selectedImageCount} selected)` : ''}`}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            
            {selectedImageCount === 1 && (
              <Button 
                size="icon"
                variant="ghost"
                onClick={onUpscaleImage}
                className="h-8 w-8"
                title="Upscale Image"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
        
        <div className="w-px h-6 bg-border" />
        
        {/* Export */}
        <Button 
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          title={hasSelectedImage ? `Download ${selectedImageCount > 1 ? `${selectedImageCount} images` : 'image'}` : "Select images to download"}
          onClick={onDownloadImages}
          disabled={!hasSelectedImage}
        >
          <Download className="h-4 w-4" />
        </Button>
        
        <Button 
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          title="More Options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}