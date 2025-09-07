import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export async function downloadSingleImage(imageUrl: string, filename?: string) {
  try {
    // Use our API endpoint to download the image server-side
    // This avoids CORS issues and ensures proper download
    const downloadUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename || `image-${Date.now()}.png`)}`
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || `image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
  } catch (error) {
    console.error('Failed to download image:', error)
    // Fallback: open in new tab
    window.open(imageUrl, '_blank')
  }
}

export async function downloadMultipleImages(
  images: Array<{ url: string; name?: string }>,
  zipFilename?: string
) {
  try {
    // For multiple images, we need to fetch them server-side to avoid CORS
    // Create an API endpoint that will fetch the images and return them as a zip
    
    const response = await fetch('/api/download-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: images.map(img => ({
          url: img.url,
          name: img.name || `image-${Date.now()}.png`
        }))
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to create download package')
    }
    
    const blob = await response.blob()
    const name = zipFilename || `images-${Date.now()}.zip`
    saveAs(blob, name)
    
  } catch (error) {
    console.error('Failed to download images:', error)
    // Fallback: open each image in a new tab
    images.forEach(img => {
      window.open(img.url, '_blank')
    })
  }
}