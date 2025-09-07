import { NextRequest, NextResponse } from 'next/server'
import formidable from 'formidable'
import { promises as fs } from 'fs'
import { r2Client } from '@/lib/r2-client'
import { UploadResponse } from '@/types/upload'

// Helper function to parse form data from NextRequest
async function parseFormData(request: NextRequest): Promise<{ fields: any; files: any }> {
  return new Promise(async (resolve, reject) => {
    try {
      // Convert NextRequest to Node.js request-like object
      const formData = await request.formData()
      const fields: any = {}
      const files: any = {}

      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          // Convert File to a format similar to formidable
          const buffer = Buffer.from(await value.arrayBuffer())
          files[key] = {
            originalFilename: value.name,
            mimetype: value.type,
            size: value.size,
            buffer: buffer
          }
        } else {
          fields[key] = value
        }
      }

      resolve({ fields, files })
    } catch (error) {
      reject(error)
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { fields, files } = await parseFormData(request)

    // Check if files were uploaded
    if (!files || Object.keys(files).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files uploaded' },
        { status: 400 }
      )
    }

    const uploadPromises: Promise<UploadResponse>[] = []

    // Handle multiple files
    for (const [fieldName, fileData] of Object.entries(files)) {
      const file = fileData as any
      
      // Validate file size (10MB limit)
      const maxFileSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { success: false, error: `File ${file.originalFilename} is too large. Maximum size is 10MB.` },
          { status: 400 }
        )
      }

      // Validate file type (images only for now)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.mimetype)) {
        return NextResponse.json(
          { success: false, error: `File type ${file.mimetype} is not allowed.` },
          { status: 400 }
        )
      }

      // Upload to R2
      const uploadPromise = r2Client.uploadFile(
        file.buffer,
        file.originalFilename,
        file.mimetype,
        'uploads' // prefix folder
      )
      
      uploadPromises.push(uploadPromise)
    }

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises)
    
    // Check if any uploads failed
    const failedUploads = results.filter(result => !result.success)
    if (failedUploads.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `${failedUploads.length} upload(s) failed`,
          details: failedUploads 
        },
        { status: 500 }
      )
    }

    // Return success response
    const uploadedFiles = results.map(result => ({
      url: result.url,
      key: result.key
    }))

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${results.length} file(s)`
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    )
  }
}

// Handle base64 image uploads (for AI-generated images)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { base64Data, filename, prefix } = body

    if (!base64Data || !filename) {
      return NextResponse.json(
        { success: false, error: 'Missing base64Data or filename' },
        { status: 400 }
      )
    }

    const result = await r2Client.uploadBase64Image(base64Data, filename, prefix || 'ai-generated')
    
    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Base64 upload API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Base64 upload failed' 
      },
      { status: 500 }
    )
  }
}

// Delete uploaded files
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { key } = body

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Missing file key' },
        { status: 400 }
      )
    }

    const result = await r2Client.deleteFile(key)
    
    if (!result.success) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'File deleted successfully' 
    })

  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Delete failed' 
      },
      { status: 500 }
    )
  }
}