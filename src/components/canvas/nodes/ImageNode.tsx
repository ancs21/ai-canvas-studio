'use client'

import { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ImageIcon, Edit, Sparkles } from 'lucide-react'
import Image from 'next/image'

interface ImageNodeData {
  src: string
  alt: string
  prompt: string
}

export function ImageNode({ data }: { data: ImageNodeData }) {
  const [prompt, setPrompt] = useState(data.prompt || '')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    try {
      // TODO: Implement image generation API call
      console.log('Generating image with prompt:', prompt)
      // Placeholder for now
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error('Error generating image:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="w-64 shadow-lg">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            {data.src ? (
              <Image 
                src={data.src} 
                alt={data.alt} 
                width={200} 
                height={200}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Edit className="w-4 h-4 mr-2" />
                Edit Image
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate New Image</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Describe the image you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={handleGenerateImage} 
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Image'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: '#555' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: '#555' }}
        />
      </CardContent>
    </Card>
  )
}