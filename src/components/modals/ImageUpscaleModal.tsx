'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Maximize, Check } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface ImageUpscaleModalProps {
  isOpen: boolean
  onClose: () => void
  selectedImage: { url: string; width?: number; height?: number } | null
  onImageUpscaled: (imageUrl: string, width: number, height: number) => void
}

const upscaleModels = [
  { value: 'RealESRGAN_x4plus', label: 'RealESRGAN x4 Plus (General)' },
  { value: 'RealESRGAN_x2plus', label: 'RealESRGAN x2 Plus (General)' },
  { value: 'RealESRGAN_x4plus_anime_6B', label: 'RealESRGAN x4 Anime (Illustrations)' },
]

export function ImageUpscaleModal({
  isOpen,
  onClose,
  selectedImage,
  onImageUpscaled,
}: ImageUpscaleModalProps) {
  const [scale, setScale] = useState('2')
  const [model, setModel] = useState('RealESRGAN_x4plus')
  const [isUpscaling, setIsUpscaling] = useState(false)
  const [upscaledImageUrl, setUpscaledImageUrl] = useState<string | null>(null)
  const [upscaledDimensions, setUpscaledDimensions] = useState<{ width: number; height: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpscale = async () => {
    if (!selectedImage?.url) return
    
    setIsUpscaling(true)
    setError(null)
    setUpscaledImageUrl(null)
    setUpscaledDimensions(null)
    
    try {
      const response = await fetch('/api/upscale-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedImage.url,
          scale: parseFloat(scale),
          model
        }),
      })
      
      const data = await response.json()
      
      if (data.success && data.imageUrl) {
        setUpscaledImageUrl(data.imageUrl)
        setUpscaledDimensions({ 
          width: data.width || selectedImage.width! * parseFloat(scale), 
          height: data.height || selectedImage.height! * parseFloat(scale) 
        })
      } else {
        setError(data.error || 'Failed to upscale image')
      }
    } catch (err) {
      console.error('Upscale error:', err)
      setError('Failed to upscale image')
    } finally {
      setIsUpscaling(false)
    }
  }

  const handleAccept = () => {
    if (upscaledImageUrl && upscaledDimensions) {
      onImageUpscaled(upscaledImageUrl, upscaledDimensions.width, upscaledDimensions.height)
      handleClose()
    }
  }

  const handleClose = () => {
    setScale('2')
    setModel('RealESRGAN_x4plus')
    setUpscaledImageUrl(null)
    setUpscaledDimensions(null)
    setError(null)
    onClose()
  }

  const estimatedDimensions = selectedImage ? {
    width: Math.round((selectedImage.width || 100) * parseFloat(scale)),
    height: Math.round((selectedImage.height || 100) * parseFloat(scale))
  } : null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Maximize className="w-5 h-5" />
            Upscale Image
          </DialogTitle>
          <DialogDescription>
            Enhance image resolution using AI-powered upscaling
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Original Image Preview */}
          {selectedImage && (
            <div className="space-y-2">
              <Label>Original Image</Label>
              <Card className="overflow-hidden">
                <div className="relative bg-muted">
                  <img
                    src={selectedImage.url}
                    alt="Original"
                    className="w-full h-auto max-h-[300px] object-contain"
                  />
                  {selectedImage.width && selectedImage.height && (
                    <div className="absolute bottom-2 left-2 bg-background/90 px-2 py-1 rounded text-xs">
                      {selectedImage.width} × {selectedImage.height}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Upscaled Image Preview */}
          {upscaledImageUrl && !isUpscaling && (
            <div className="space-y-2">
              <Label>Upscaled Image</Label>
              <Card className="overflow-hidden">
                <div className="relative bg-muted">
                  <img
                    src={upscaledImageUrl}
                    alt="Upscaled"
                    className="w-full h-auto max-h-[300px] object-contain"
                  />
                  {upscaledDimensions && (
                    <div className="absolute bottom-2 left-2 bg-background/90 px-2 py-1 rounded text-xs">
                      {upscaledDimensions.width} × {upscaledDimensions.height}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Upscaling in progress */}
          {isUpscaling && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Upscaling your image...</p>
              </div>
            </div>
          )}

          {/* Settings (only show if not yet upscaled) */}
          {!upscaledImageUrl && !isUpscaling && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scale">Scale Factor</Label>
                  <Select value={scale} onValueChange={setScale}>
                    <SelectTrigger id="scale">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2x</SelectItem>
                      <SelectItem value="4">4x</SelectItem>
                    </SelectContent>
                  </Select>
                  {estimatedDimensions && (
                    <p className="text-xs text-muted-foreground">
                      Result: {estimatedDimensions.width} × {estimatedDimensions.height}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger id="model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {upscaleModels.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {model.includes('anime') ? 'Best for illustrations' : 'Best for photos'}
                  </p>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          {!upscaledImageUrl ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpscale}
                disabled={!selectedImage || isUpscaling}
              >
                {isUpscaling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upscaling...
                  </>
                ) : (
                  <>
                    <Maximize className="w-4 h-4 mr-2" />
                    Upscale Image
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleAccept}>
                <Check className="w-4 h-4 mr-2" />
                Add to Canvas
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}