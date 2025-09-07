import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { r2Client } from '@/lib/r2-client'

export async function POST(request: NextRequest) {
  try {
    const { imageUrls, imageUrl, editPrompt } = await request.json()
    
    // Log for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Edit Image API called')
    }
    
    // Support both single imageUrl (legacy) and multiple imageUrls
    const urls = imageUrls || (imageUrl ? [imageUrl] : [])

    if (urls.length === 0 || !editPrompt) {
      return NextResponse.json(
        { success: false, error: 'At least one image URL and edit prompt are required' },
        { status: 400 }
      )
    }
    
    // Limit to 3 images (API constraint)
    const imagesToProcess = urls.slice(0, 3)

    // Initialize Google GenAI with API key
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY || ''
    })

    try {
      // Fetch all images and convert to base64
      const imageBase64Array = await Promise.all(
        imagesToProcess.map(async (url: string) => {
          const imageResponse = await fetch(url)
          const imageArrayBuffer = await imageResponse.arrayBuffer()
          return Buffer.from(imageArrayBuffer).toString('base64')
        })
      )
      
      // Build parts array with all images and the edit prompt
      const parts: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> = imageBase64Array.map((base64) => ({
        inlineData: {
          mimeType: 'image/png',
          data: base64
        }
      }))
      
      // Add the text prompt
      parts.push({
        text: imagesToProcess.length === 1
          ? `Edit this image based on the following instructions: ${editPrompt}.`
          : `Combine or edit these ${imagesToProcess.length} images based on the following instructions: ${editPrompt}. You can reference them as "image 1", "image 2", etc. in order.`
      })
      
      // Generate edited/composed image using Gemini 2.5 Flash Image model
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: [
          {
            parts
          }
        ]
      })

      // Check if response contains edited image
      if (response.candidates && response.candidates[0]) {
        const parts = response.candidates[0].content?.parts

        if (parts) {
          for (const part of parts) {
          // Check for inline image data
          if (part.inlineData && part.inlineData.data) {
            const editedImageBase64 = part.inlineData.data
            // Upload edited image to R2
            
            // Upload to R2
            const uploadResult = await r2Client.uploadBase64Image(
              editedImageBase64,
              `edited-${Date.now()}-${Math.random().toString(36).substring(2)}.png`,
              'ai-generated'
            )
            
            if (uploadResult.success && uploadResult.url) {
              // Image successfully edited and uploaded
              return NextResponse.json({
                success: true,
                imageUrl: uploadResult.url,
                editPrompt
              })
            } else {
              // Failed to upload to R2, return base64 as fallback
              // Return base64 as fallback
              return NextResponse.json({
                success: true,
                imageUrl: `data:image/png;base64,${editedImageBase64}`,
                editPrompt,
                note: 'Image edited but R2 upload failed, returning base64'
              })
            }
          }
        }
        }
      }

      // Fallback if no edited image was generated
      return NextResponse.json({
        success: false,
        error: 'No edited image was generated. The model may not support image editing yet.',
        editPrompt
      })

    } catch (modelError) {
      // Handle model error
      const errorMessage = modelError instanceof Error ? modelError.message : String(modelError)
      
      // Check if it's a model availability issue
      if (errorMessage.includes('model') || errorMessage.includes('not found')) {
        return NextResponse.json({
          success: false,
          error: 'Image editing model not available. Please ensure you have access to gemini-2.5-flash-image-preview.',
          editPrompt
        })
      }
      
      throw modelError
    }

  } catch (error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error editing image:', error)
    }
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to edit image' 
      },
      { status: 500 }
    )
  }
}