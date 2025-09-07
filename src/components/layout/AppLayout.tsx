'use client'

import { CanvasEditor } from "@/components/canvas/CanvasEditor"
import { CanvasProvider } from "@/contexts/CanvasContext"

export function AppLayout() {
  return (
    <CanvasProvider>
      <div className="h-screen w-full">
        <CanvasEditor />
      </div>
    </CanvasProvider>
  )
}