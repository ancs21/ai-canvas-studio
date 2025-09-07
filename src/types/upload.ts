export interface UploadResponse {
  success: boolean
  url?: string
  key?: string
  error?: string
}

export interface PresignedUrlResponse {
  success: boolean
  presignedUrl?: string
  key?: string
  error?: string
}

export interface FileUploadProps {
  onUploadComplete?: (url: string, key: string) => void
  onUploadError?: (error: string) => void
  onUploadProgress?: (progress: number) => void
  maxFileSize?: number // in bytes
  allowedFileTypes?: string[]
  multiple?: boolean
  className?: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface R2Config {
  accessKeyId: string
  secretAccessKey: string
  accountId: string
  bucketName: string
  endpoint: string
  region?: string
  publicDomain?: string
}

export interface FileMetadata {
  originalName: string
  size: number
  type: string
  key: string
  url: string
  uploadedAt: Date
}