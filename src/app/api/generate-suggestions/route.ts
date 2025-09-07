import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Initialize Google GenAI with API key
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY || ''
    })

    const enhancementPrompt = `Generate 3 optimized image generation prompts based on this request: "${prompt}"
    
    Create 3 unique approaches:
    1. One photorealistic/professional with detailed lighting and composition
    2. One artistic/creative with specific visual style and mood  
    3. One minimalist/modern with clean composition and aesthetic
    
    Each prompt should:
    - Start with image type and primary subject
    - Include specific visual characteristics and details
    - Define lighting, mood, and composition
    - Use narrative description rather than keyword lists
    - Be 1-2 sentences maximum
    
    Return only the 3 prompts, one per line, no numbering or extra text.`

    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: enhancementPrompt
    })
    
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    const suggestions = text
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 3)

    return NextResponse.json({
      success: true,
      suggestions: suggestions.length > 0 ? suggestions : [prompt]
    })

  } catch (error) {
    console.error('Error generating suggestions:', error)
    
    // Fallback suggestions if API fails
    const fallbackSuggestions = [
      `A photorealistic ${prompt} with professional studio lighting, sharp focus, and high detail capturing every texture and surface`,
      `An artistic interpretation of ${prompt} in vibrant watercolor style with flowing brushstrokes and dreamy atmospheric effects`,
      `A minimalist ${prompt} with clean geometric shapes, monochromatic color palette, and negative space composition`
    ]
    
    return NextResponse.json({
      success: true,
      suggestions: fallbackSuggestions
    })
  }
}