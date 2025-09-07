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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Edit3, RefreshCw, Check, Layers } from 'lucide-react'
import { ImagePreview } from './components/ImagePreview'
import { detectAspectRatio } from '@/lib/utils'

interface ImageEditModalProps {
  isOpen: boolean
  onClose: () => void
  selectedImages: Array<{ url: string; prompt?: string; width?: number; height?: number }>
  onImageEdited: (imageUrl: string, prompt: string, replace: boolean) => void
}

export function ImageEditModal({
  isOpen,
  onClose,
  selectedImages,
  onImageEdited,
}: ImageEditModalProps) {
  const [editPrompt, setEditPrompt] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleEdit = async () => {
    if (!editPrompt.trim()) return
    
    setIsEditing(true)
    setError(null)
    setEditedImageUrl(null)
    
    try {
      const response = await fetch('/api/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls: selectedImages.map(img => img.url),
          editPrompt
        }),
      })
      
      const data = await response.json()
      
      if (data.success && data.imageUrl) {
        setEditedImageUrl(data.imageUrl)
      } else {
        setError(data.error || 'Failed to edit image')
      }
    } catch (err) {
      setError('Failed to edit image')
    } finally {
      setIsEditing(false)
    }
  }

  const handleAccept = () => {
    if (editedImageUrl) {
      // Always add as new (false = don't replace)
      onImageEdited(editedImageUrl, editPrompt, false)
      handleClose()
    }
  }

  const handleClose = () => {
    setEditPrompt('')
    setEditedImageUrl(null)
    setError(null)
    onClose()
  }

  const handleRegenerate = () => {
    // Reset the edited image to allow editing the prompt again
    setEditedImageUrl(null)
    setError(null)
  }
  
  const handleRegenerateWithSamePrompt = () => {
    // Regenerate with the same prompt
    handleEdit()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit Image
          </DialogTitle>
          <DialogDescription>
            {selectedImages.length === 1 ? (
              'Modify the selected image using AI-powered editing'
            ) : (
              <>
                Combine or edit {selectedImages.length} selected images
                {selectedImages.length > 3 && (
                  <span className="block mt-1 text-amber-600">
                    Note: Using first 3 images (API limit)
                  </span>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                {selectedImages.length === 1 ? 'Original Image' : `Selected Images (${selectedImages.length})`}
              </Label>
              {selectedImages.length === 1 ? (
                <ImagePreview
                  imageUrl={selectedImages[0].url}
                  prompt={selectedImages[0].prompt || 'Original image'}
                  aspectRatio={
                    selectedImages[0].width && selectedImages[0].height
                      ? detectAspectRatio(selectedImages[0].width, selectedImages[0].height)
                      : '1:1'
                  }
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {selectedImages.map((img, index) => (
                    <div key={index} className="relative">
                      <div className="absolute top-2 left-2 z-10 bg-background/90 backdrop-blur-sm rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border">
                        {index + 1}
                      </div>
                      <ImagePreview
                        imageUrl={img.url}
                        prompt={img.prompt ? `${img.prompt.substring(0, 50)}${img.prompt.length > 50 ? '...' : ''}` : `Image ${index + 1}`}
                        aspectRatio={
                          img.width && img.height
                            ? detectAspectRatio(img.width, img.height)
                            : '1:1'
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {editedImageUrl && !isEditing && (
              <div className="space-y-2">
                <Label>Edited Image</Label>
                <ImagePreview
                  imageUrl={editedImageUrl}
                  prompt={editPrompt}
                  aspectRatio="1:1"
                />
              </div>
            )}

            {isEditing && (
              <div className="flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Editing your image...</p>
                </div>
              </div>
            )}
          </div>

          {/* Always show edit prompt and controls */}
          <div className="space-y-2">
            <Label htmlFor="edit-prompt">
              {selectedImages.length === 1 ? 'Edit Instructions' : 'Composition Instructions'}
            </Label>
            <Textarea
              id="edit-prompt"
              placeholder={
                selectedImages.length === 1
                  ? "Describe how you want to edit the image (e.g., 'remove background', 'make it vintage', 'add sunset lighting')..."
                  : `Describe how to combine these ${selectedImages.length} images. Reference them by their numbers (1, 2${selectedImages.length > 2 ? ', 3' : ''}) shown on each image. Examples: 'Put subject from image 1 on background of image 2', 'Blend all images into a collage', 'Apply style of image 1 to image 2'...`
              }
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              className="min-h-[100px]"
              disabled={isEditing}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            {!editedImageUrl ? (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleEdit}
                  disabled={!editPrompt.trim() || isEditing}
                >
                  {isEditing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Editing...
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Image
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={isEditing}
                  title="Go back to edit the prompt"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Prompt
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRegenerateWithSamePrompt}
                  disabled={isEditing || !editPrompt.trim()}
                  title="Generate again with the same prompt"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
                <Button onClick={handleAccept}>
                  <Check className="w-4 h-4 mr-2" />
                  Add to Canvas
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}