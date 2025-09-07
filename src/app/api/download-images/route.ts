import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  try {
    const { images } = await request.json()
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      )
    }
    
    const zip = new JSZip()
    
    // Fetch all images server-side (no CORS issues)
    const fetchPromises = images.map(async (img: { url: string; name: string }, index: number) => {
      try {
        const response = await fetch(img.url)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        // Ensure filename has extension
        let filename = img.name || `image-${index + 1}`
        if (!filename.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
          filename += '.png'
        }
        
        return { filename, buffer, success: true }
      } catch (error) {
        console.error(`Failed to fetch image ${index + 1}:`, error)
        return { 
          filename: `error-${index + 1}.txt`, 
          buffer: Buffer.from(`Failed to download image from: ${img.url}\nError: ${error}`),
          success: false 
        }
      }
    })
    
    const results = await Promise.all(fetchPromises)
    
    // Check if at least one image was successfully fetched
    const successfulImages = results.filter(r => r.success)
    if (successfulImages.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch any images' },
        { status: 500 }
      )
    }
    
    // Add all files to zip
    results.forEach(({ filename, buffer }) => {
      zip.file(filename, buffer)
    })
    
    // Generate zip file
    const zipBuffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })
    
    // Return zip file as response
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="images-${Date.now()}.zip"`,
      },
    })
    
  } catch (error) {
    console.error('Error creating download package:', error)
    return NextResponse.json(
      { error: 'Failed to create download package' },
      { status: 500 }
    )
  }
}