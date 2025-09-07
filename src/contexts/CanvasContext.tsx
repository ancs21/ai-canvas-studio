'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { Node } from '@xyflow/react'

interface CanvasContextType {
  selectedNodes: Node[]
  sharedNodes: Node[]
  setSelectedNodes: (nodes: Node[]) => void
  shareSelectedNodes: () => void
  removeSharedNode: (nodeId: string) => void
  clearSharedNodes: () => void
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined)

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([])
  const [sharedNodes, setSharedNodes] = useState<Node[]>([])

  const shareSelectedNodes = () => {
    // Add selected nodes to shared context, avoiding duplicates
    setSharedNodes(prev => {
      const existingIds = new Set(prev.map(node => node.id))
      const newNodes = selectedNodes.filter(node => !existingIds.has(node.id))
      return [...prev, ...newNodes]
    })
  }

  const removeSharedNode = (nodeId: string) => {
    setSharedNodes(prev => prev.filter(node => node.id !== nodeId))
  }

  const clearSharedNodes = () => {
    setSharedNodes([])
  }

  return (
    <CanvasContext.Provider
      value={{
        selectedNodes,
        sharedNodes,
        setSelectedNodes,
        shareSelectedNodes,
        removeSharedNode,
        clearSharedNodes,
      }}
    >
      {children}
    </CanvasContext.Provider>
  )
}

export function useCanvasContext() {
  const context = useContext(CanvasContext)
  if (context === undefined) {
    throw new Error('useCanvasContext must be used within a CanvasProvider')
  }
  return context
}