import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { R2Config, FileMetadata, UploadResponse } from '@/types/upload'

class R2Client {
  private client: S3Client
  private config: R2Config

  constructor() {
    this.config = {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      accountId: process.env.R2_ACCOUNT_ID!,
      bucketName: process.env.R2_BUCKET_NAME!,
      endpoint: process.env.R2_ENDPOINT!,
      region: 'auto', // Cloudflare R2 uses 'auto' as region
      publicDomain: process.env.R2_PUBLIC_DOMAIN, // Optional public domain
    }

    // Validate required environment variables
    const requiredVars = ['accessKeyId', 'secretAccessKey', 'accountId', 'bucketName', 'endpoint']
    for (const key of requiredVars) {
      if (!this.config[key as keyof R2Config]) {
        throw new Error(`Missing required environment variable: R2_${key.toUpperCase()}`)
      }
    }

    this.client = new S3Client({
      region: this.config.region,
      endpoint: this.config.endpoint,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      // Force path-style URLs for R2 compatibility
      forcePathStyle: true,
    })
  }

  /**
   * Generate a unique key for the uploaded file
   */
  private generateKey(originalName: string, prefix?: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const keyPrefix = prefix ? `${prefix}/` : ''
    return `${keyPrefix}${timestamp}_${random}_${sanitizedName}`
  }

  /**
   * Upload a file buffer to R2
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    contentType: string,
    prefix?: string
  ): Promise<UploadResponse> {
    try {
      const key = this.generateKey(originalName, prefix)
      
      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        // Add metadata
        Metadata: {
          originalName: originalName,
          uploadedAt: new Date().toISOString(),
        }
      })

      await this.client.send(command)

      // Construct public URL using the public domain if available
      const publicUrl = this.getPublicUrl(key)

      return {
        success: true,
        url: publicUrl,
        key: key
      }
    } catch (error) {
      console.error('R2 upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  /**
   * Generate a presigned URL for direct browser upload
   */
  async generatePresignedUploadUrl(
    originalName: string,
    contentType: string,
    expiresIn: number = 3600, // 1 hour default
    prefix?: string
  ): Promise<{ presignedUrl: string; key: string }> {
    const key = this.generateKey(originalName, prefix)
    
    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      ContentType: contentType,
      Metadata: {
        originalName: originalName,
        uploadedAt: new Date().toISOString(),
      }
    })

    const presignedUrl = await getSignedUrl(this.client, command, { 
      expiresIn 
    })

    return { presignedUrl, key }
  }

  /**
   * Generate a presigned URL for downloading/viewing a file
   */
  async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
    })

    return await getSignedUrl(this.client, command, { expiresIn })
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      })

      await this.client.send(command)
      
      return { success: true }
    } catch (error) {
      console.error('R2 delete error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      }
    }
  }

  /**
   * Get the public URL for a file
   */
  getPublicUrl(key: string): string {
    // Use public domain if available, otherwise fall back to endpoint
    if (this.config.publicDomain) {
      return `${this.config.publicDomain}/${key}`
    }
    return `${this.config.endpoint}/${this.config.bucketName}/${key}`
  }

  /**
   * Upload a base64 image (from AI generation)
   */
  async uploadBase64Image(
    base64Data: string,
    filename: string,
    prefix?: string
  ): Promise<UploadResponse> {
    try {
      // Remove data URL prefix if present
      const base64Content = base64Data.replace(/^data:image\/[^;]+;base64,/, '')
      const buffer = Buffer.from(base64Content, 'base64')
      
      // Determine content type from base64 data URL or default to PNG
      let contentType = 'image/png'
      const dataUrlMatch = base64Data.match(/^data:([^;]+);base64,/)
      if (dataUrlMatch) {
        contentType = dataUrlMatch[1]
      }

      return await this.uploadFile(buffer, filename, contentType, prefix)
    } catch (error) {
      console.error('Base64 upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Base64 upload failed'
      }
    }
  }
}

// Export a singleton instance
export const r2Client = new R2Client()
export default r2Client