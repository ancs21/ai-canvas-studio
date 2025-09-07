import { NextRequest, NextResponse } from 'next/server'
import { r2Client } from '@/lib/r2-client'
import { PresignedUrlResponse } from '@/types/upload'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { filename, contentType, prefix, expiresIn = 3600 } = body

    // Validate required fields
    if (!filename || !contentType) {
      return NextResponse.json(
        { success: false, error: 'Missing filename or contentType' },
        { status: 400 }
      )
    }

    // Validate file type (images only for now)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { success: false, error: `File type ${contentType} is not allowed.` },
        { status: 400 }
      )
    }

    // Generate presigned URL
    const { presignedUrl, key } = await r2Client.generatePresignedUploadUrl(
      filename,
      contentType,
      expiresIn,
      prefix
    )

    const response: PresignedUrlResponse = {
      success: true,
      presignedUrl,
      key
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Presigned URL generation error:', error)
    const response: PresignedUrlResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate presigned URL'
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

// Generate presigned URL for downloading/viewing files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600')

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Missing key parameter' },
        { status: 400 }
      )
    }

    const presignedUrl = await r2Client.generatePresignedDownloadUrl(key, expiresIn)

    return NextResponse.json({
      success: true,
      presignedUrl,
      key
    })

  } catch (error) {
    console.error('Presigned download URL generation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate presigned download URL' 
      },
      { status: 500 }
    )
  }
}