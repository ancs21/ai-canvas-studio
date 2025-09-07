'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

interface PromptSuggestionsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

const styles = ['Photorealistic', 'Artistic', 'Minimalist']

export function PromptSuggestions({ suggestions, onSelect }: PromptSuggestionsProps) {
  if (suggestions.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="w-4 h-4" />
        <span>AI-Enhanced Suggestions</span>
      </div>
      <div className="grid gap-2">
        {suggestions.map((suggestion, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onSelect(suggestion)}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="shrink-0">
                  {styles[index] || 'Creative'}
                </Badge>
                <p className="text-sm flex-1">{suggestion}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}