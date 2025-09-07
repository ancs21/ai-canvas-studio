'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { FileUploadProps, UploadProgress } from '@/types/upload'

export function FileUploader({
  onUploadComplete,
  onUploadError,
  onUploadProgress,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  multiple = false,
  className
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string; key: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File ${file.name} is too large. Maximum size is ${Math.round(maxFileSize / (1024 * 1024))}MB.`
    }

    if (!allowedFileTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed.`
    }

    return null
  }

  const uploadFiles = async (files: FileList) => {
    setIsUploading(true)
    setError(null)
    setUploadProgress({ loaded: 0, total: 100, percentage: 0 })

    try {
      const formData = new FormData()
      
      // Validate all files first
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const validationError = validateFile(file)
        if (validationError) {
          setError(validationError)
          setIsUploading(false)
          setUploadProgress(null)
          return
        }
        formData.append(`file${i}`, file)
      }

      // Track upload progress (simulated for now, real implementation would need xhr)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (!prev || prev.percentage >= 90) return prev
          const newPercentage = Math.min(prev.percentage + 10, 90)
          return {
            loaded: newPercentage,
            total: 100,
            percentage: newPercentage
          }
        })
      }, 200)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      // Update progress to 100%
      setUploadProgress({ loaded: 100, total: 100, percentage: 100 })

      // Add uploaded files to the list
      const newFiles = result.files.map((file: any, index: number) => ({
        name: files[index].name,
        url: file.url,
        key: file.key
      }))

      setUploadedFiles(prev => [...prev, ...newFiles])

      // Call success callbacks
      newFiles.forEach((file: any) => {
        onUploadComplete?.(file.url, file.key)
      })

      if (onUploadProgress) {
        onUploadProgress(100)
      }

      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(null)
      }, 1500)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setError(errorMessage)
      onUploadError?.(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          'hover:border-primary/50 hover:bg-primary/5',
          isDragOver && 'border-primary bg-primary/10',
          isUploading && 'pointer-events-none opacity-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type=\"file\"
          className=\"hidden\"
          accept={allowedFileTypes.join(',')}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={isUploading}
        />

        <div className=\"flex flex-col items-center space-y-4\">
          {isUploading ? (
            <Loader2 className=\"w-12 h-12 text-primary animate-spin\" />
          ) : (
            <Upload className=\"w-12 h-12 text-muted-foreground\" />
          )}

          <div className=\"space-y-2\">
            <p className=\"text-lg font-medium\">
              {isUploading ? 'Uploading...' : 'Drop files here or click to browse'}
            </p>
            <p className=\"text-sm text-muted-foreground\">
              Supports: {allowedFileTypes.map(type => type.split('/')[1]).join(', ')} 
              (Max {Math.round(maxFileSize / (1024 * 1024))}MB each)
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {uploadProgress && (
        <div className=\"space-y-2\">
          <div className=\"flex justify-between text-sm\">
            <span>Uploading...</span>
            <span>{uploadProgress.percentage}%</span>
          </div>
          <Progress value={uploadProgress.percentage} className=\"w-full\" />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className=\"flex items-center space-x-2 p-4 border border-red-200 bg-red-50 rounded-lg text-red-700\">
          <AlertCircle className=\"w-5 h-5 flex-shrink-0\" />
          <p className=\"text-sm\">{error}</p>
          <Button
            variant=\"ghost\"
            size=\"sm\"
            onClick={() => setError(null)}
            className=\"ml-auto text-red-700 hover:text-red-800\"
          >
            <X className=\"w-4 h-4\" />
          </Button>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className=\"space-y-2\">
          <h4 className=\"text-sm font-medium\">Uploaded Files</h4>
          <div className=\"space-y-2\">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className=\"flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200\"
              >
                <div className=\"flex items-center space-x-2\">
                  <CheckCircle className=\"w-4 h-4 text-green-600\" />
                  <span className=\"text-sm font-medium\">{file.name}</span>
                  <a
                    href={file.url}
                    target=\"_blank\"
                    rel=\"noopener noreferrer\"
                    className=\"text-xs text-blue-600 hover:underline\"
                  >
                    View
                  </a>
                </div>
                <Button
                  variant=\"ghost\"
                  size=\"sm\"
                  onClick={() => removeUploadedFile(index)}
                  className=\"text-muted-foreground hover:text-foreground\"
                >
                  <X className=\"w-4 h-4\" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploader