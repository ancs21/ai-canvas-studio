import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4'

/**
 * Detects the closest standard aspect ratio from width and height
 * @param width - The width of the image
 * @param height - The height of the image
 * @returns The closest standard aspect ratio
 */
export function detectAspectRatio(width: number, height: number): AspectRatio {
  const ratio = width / height
  
  // Define standard ratios with tolerance
  const ratios: { value: AspectRatio; ratio: number; tolerance: number }[] = [
    { value: '1:1', ratio: 1, tolerance: 0.1 },
    { value: '16:9', ratio: 16/9, tolerance: 0.15 },
    { value: '9:16', ratio: 9/16, tolerance: 0.15 },
    { value: '4:3', ratio: 4/3, tolerance: 0.1 },
    { value: '3:4', ratio: 3/4, tolerance: 0.1 },
  ]
  
  // Find the closest matching ratio
  for (const { value, ratio: targetRatio, tolerance } of ratios) {
    if (Math.abs(ratio - targetRatio) <= tolerance) {
      return value
    }
  }
  
  // Default based on orientation
  if (ratio > 1.5) return '16:9'
  if (ratio < 0.67) return '9:16'
  if (ratio > 1) return '4:3'
  if (ratio < 1) return '3:4'
  return '1:1'
}
