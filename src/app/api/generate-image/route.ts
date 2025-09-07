import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { r2Client } from '@/lib/r2-client'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    
    // Log for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Generate Image API called')
    }

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

    try {
      // Generate image using Gemini 2.5 Flash Image model
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: prompt,
      })

      // Check if response contains image data
      if (response.candidates && response.candidates[0]) {
        const parts = response.candidates[0].content?.parts

        if (parts) {
          for (const part of parts) {
          // Check for inline image data
          if (part.inlineData && part.inlineData.data) {
            const imageBase64 = part.inlineData.data
            // Upload to R2
            
            // Upload to R2
            const uploadResult = await r2Client.uploadBase64Image(
              imageBase64,
              `generated-${Date.now()}-${Math.random().toString(36).substring(2)}.png`,
              'ai-generated'
            )
            
            if (uploadResult.success && uploadResult.url) {
              // Image successfully generated and uploaded
              return NextResponse.json({
                success: true,
                imageUrl: uploadResult.url,
                prompt
              })
            } else {
              // Failed to upload to R2, return base64 as fallback
              // Return base64 as fallback
              return NextResponse.json({
                success: true,
                imageUrl: `data:image/png;base64,${imageBase64}`,
                prompt,
                note: 'Image generated but R2 upload failed, returning base64'
              })
            }
          }
        }
        }
      }

      // Fallback if no image was generated
      return NextResponse.json({
        success: false,
        error: 'No image was generated. The model may not support image generation yet.',
        prompt
      })

    } catch (modelError) {
      // Handle model error
      const errorMessage = modelError instanceof Error ? modelError.message : String(modelError)
      
      // Check if it's a model availability issue
      if (errorMessage.includes('model') || errorMessage.includes('not found')) {
        // Fallback to text generation with image description
        const fallbackModel = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: `Describe in detail what an image would look like for: ${prompt}`,
        })
        
        const description = fallbackModel.candidates?.[0]?.content?.parts?.[0]?.text || 'Image description not available'
        
        return NextResponse.json({
          success: false,
          error: 'Image generation model not available. Please ensure you have access to gemini-2.5-flash-image-preview.',
          description,
          prompt
        })
      }
      
      throw modelError
    }

  } catch (error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating image:', error)
    }
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate image' 
      },
      { status: 500 }
    )
  }
}