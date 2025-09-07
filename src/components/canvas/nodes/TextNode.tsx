'use client'

import { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Type, Edit, Sparkles } from 'lucide-react'

interface TextNodeData {
  label: string
  content: string
}

export function TextNode({ data }: { data: TextNodeData }) {
  const [content, setContent] = useState(data.content || '')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateText = async () => {
    setIsGenerating(true)
    try {
      // TODO: Implement text generation API call
      console.log('Generating text content')
      // Placeholder for now
      await new Promise(resolve => setTimeout(resolve, 1500))
      setContent('AI-generated content will appear here...')
    } catch (error) {
      console.error('Error generating text:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="w-64 shadow-lg">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="min-h-[100px] p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Type className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {data.label}
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              {content || 'No content yet...'}
            </p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Edit className="w-4 h-4 mr-2" />
                Edit Text
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Text Content</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your text content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleGenerateText} 
                    disabled={isGenerating}
                    variant="outline"
                    className="flex-1"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'AI Enhance'}
                  </Button>
                  <Button className="flex-1">
                    Save Changes
                  </Button>
                </div>
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