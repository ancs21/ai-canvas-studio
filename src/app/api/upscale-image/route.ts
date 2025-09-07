import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { r2Client } from '@/lib/r2-client'

// Configure fal.ai client
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY
  })
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, scale = 2, model = 'RealESRGAN_x4plus' } = await request.json()
    
    // Log for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Upscale Image API called')
    }

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      )
    }

    if (!process.env.FAL_KEY) {
      // FAL_KEY not configured
      return NextResponse.json(
        { success: false, error: 'Upscaling service not configured. Please add FAL_KEY to environment variables.' },
        { status: 500 }
      )
    }

    try {
      // Send request to fal.ai
      
      // Call fal.ai ESRGAN upscale model
      const result = await fal.subscribe('fal-ai/esrgan', {
        input: {
          image_url: imageUrl,
          scale: scale,
          model: model,
          output_format: 'png'
        }
      }) as {
        image?: {
          url: string
          width: number
          height: number
        }
      }

      // Received response from fal.ai

      if (result.image && result.image.url) {
        // Download the upscaled image
        const imageResponse = await fetch(result.image.url)
        const imageArrayBuffer = await imageResponse.arrayBuffer()
        const imageBase64 = Buffer.from(imageArrayBuffer).toString('base64')
        
        // Upload to R2
        // Upload to R2
        const uploadResult = await r2Client.uploadBase64Image(
          imageBase64,
          `upscaled-${Date.now()}-${Math.random().toString(36).substring(2)}.png`,
          'upscaled'
        )
        
        if (uploadResult.success && uploadResult.url) {
          // Image successfully upscaled and uploaded
          
          return NextResponse.json({
            success: true,
            imageUrl: uploadResult.url,
            width: result.image.width,
            height: result.image.height,
            scale
          })
        } else {
          // Failed to upload to R2
          // Return fal.ai URL as fallback
          return NextResponse.json({
            success: true,
            imageUrl: result.image.url,
            width: result.image.width,
            height: result.image.height,
            scale,
            note: 'Using fal.ai URL directly (R2 upload failed)'
          })
        }
      } else {
        // No image in fal.ai response
        return NextResponse.json({
          success: false,
          error: 'No upscaled image was generated'
        })
      }

    } catch (falError) {
      // Handle fal.ai API error
      const errorMessage = falError instanceof Error ? falError.message : String(falError)
      
      if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        return NextResponse.json({
          success: false,
          error: 'Invalid FAL_KEY. Please check your API key.'
        })
      }
      
      return NextResponse.json({
        success: false,
        error: falError.message || 'Failed to upscale image'
      })
    }

  } catch (error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error upscaling image:', error)
    }
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upscale image' 
      },
      { status: 500 }
    )
  }
}