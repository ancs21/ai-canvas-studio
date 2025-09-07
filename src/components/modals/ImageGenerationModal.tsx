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
import { Loader2, Sparkles, RefreshCw, Check } from 'lucide-react'
import { PromptSuggestions } from './components/PromptSuggestions'
import { ImagePreview } from './components/ImagePreview'

interface ImageGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  onImageGenerated: (imageUrl: string, prompt: string) => void
}

export function ImageGenerationModal({
  isOpen,
  onClose,
  onImageGenerated,
}: ImageGenerationModalProps) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateSuggestions = async () => {
    if (!prompt.trim()) return
    
    setIsLoadingSuggestions(true)
    setError(null)
    
    try {
      const response = await fetch('/api/generate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      
      const data = await response.json()
      if (data.success) {
        setSuggestions(data.suggestions)
      } else {
        setError(data.error || 'Failed to generate suggestions')
      }
    } catch (err) {
      setError('Failed to generate suggestions')
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const handleGenerate = async (finalPrompt?: string) => {
    const promptToUse = finalPrompt || prompt
    if (!promptToUse.trim()) return
    
    setIsGenerating(true)
    setError(null)
    setGeneratedImageUrl(null)
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse
        }),
      })
      
      const data = await response.json()
      
      if (data.success && data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl)
      } else {
        setError(data.error || 'Failed to generate image')
      }
    } catch (err) {
      setError('Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAccept = () => {
    if (generatedImageUrl) {
      onImageGenerated(generatedImageUrl, prompt)
      handleClose()
    }
  }

  const handleClose = () => {
    setPrompt('')
    setGeneratedImageUrl(null)
    setSuggestions([])
    setError(null)
    onClose()
  }

  const handleRegenerate = () => {
    handleGenerate()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate Image
          </DialogTitle>
          <DialogDescription>
            Create AI-generated images using natural language descriptions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!generatedImageUrl && (
            <>
              <div className="space-y-2">
                <Label htmlFor="prompt">Image Description</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the image you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isGenerating}
                />
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateSuggestions}
                    disabled={!prompt.trim() || isLoadingSuggestions || isGenerating}
                  >
                    {isLoadingSuggestions ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Getting suggestions...
                      </>
                    ) : (
                      'Get AI Suggestions'
                    )}
                  </Button>
                </div>
              </div>

              {suggestions.length > 0 && (
                <PromptSuggestions
                  suggestions={suggestions}
                  onSelect={(suggestion) => setPrompt(suggestion)}
                />
              )}
            </>
          )}

          {isGenerating && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Generating your image...</p>
              </div>
            </div>
          )}

          {generatedImageUrl && !isGenerating && (
            <ImagePreview
              imageUrl={generatedImageUrl}
              prompt={prompt}
              aspectRatio="1:1"
            />
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          {!generatedImageUrl ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
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
                disabled={isGenerating}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}