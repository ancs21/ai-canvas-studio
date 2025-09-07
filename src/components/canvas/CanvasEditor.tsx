'use client'

import { useCallback, useState, useEffect } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  NodeResizer,
  Handle,
  Position,
  SelectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCanvasContext } from '@/contexts/CanvasContext'
import { ToolbarControls } from './ToolbarControls'
import { ImageGenerationModal } from '@/components/modals/ImageGenerationModal'
import { ImageEditModal } from '@/components/modals/ImageEditModal'
import { ImageUpscaleModal } from '@/components/modals/ImageUpscaleModal'
import { downloadSingleImage, downloadMultipleImages } from '@/lib/download-utils'

// Custom resizable node component
interface NodeData {
  type?: string
  fileUrl?: string
  label?: string
  fileName?: string
  prompt?: string
}

function ResizableNode({ data, selected }: { data: NodeData; selected: boolean }) {
  const renderContent = () => {
    if (data.type === 'image' && data.fileUrl) {
      return (
        <img
          src={data.fileUrl}
          alt={data.label}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: '4px'
          }}
        />
      )
    }
    
    if (data.type === 'video' && data.fileUrl) {
      return (
        <video
          src={data.fileUrl}
          controls
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '4px'
          }}
        />
      )
    }
    
    if (data.type === 'audio' && data.fileUrl) {
      return (
        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '24px' }}>🎵</div>
          <div style={{ fontSize: '12px', textAlign: 'center' }}>{data.fileName || 'Audio File'}</div>
          <audio
            src={data.fileUrl}
            controls
            style={{ width: '100%', maxWidth: '200px' }}
          />
        </div>
      )
    }
    
    return (
      <div style={{ padding: '10px' }}>
        {data.label}
      </div>
    )
  }

  return (
    <>
      <NodeResizer
        color="#4F46E5"
        isVisible={selected}
        minWidth={100}
        minHeight={50}
        keepAspectRatio={data.type === 'image'}
      />
      {renderContent()}
    </>
  )
}

const nodeTypes = {
  resizable: ResizableNode,
}

const initialNodes: Node[] = []

const initialEdges: Edge[] = []

// Canvas file upload helper - uploads to R2 and returns public URL
const uploadFileToR2 = async (file: File): Promise<string | null> => {
  try {
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    // Upload to R2 via our API
    const response = await fetch('/api/upload', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Data,
        filename: file.name,
        prefix: 'canvas'
      }),
    })

    const result = await response.json()
    
    if (result.success && result.url) {
      return result.url
    } else {
      console.error('Failed to upload to R2:', result.error)
      return null
    }
  } catch (error) {
    console.error('Error uploading file to R2:', error)
    return null
  }
}

function CanvasEditorInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedTool, setSelectedTool] = useState<'select' | 'node' | 'edge'>('select')
  const { setSelectedNodes, shareSelectedNodes, sharedNodes } = useCanvasContext()
  const { screenToFlowPosition, getViewport } = useReactFlow()
  
  // Modal states
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedImagesForEdit, setSelectedImagesForEdit] = useState<Array<{ url: string; prompt?: string; width?: number; height?: number }> | null>(null)
  const [isUpscaleModalOpen, setIsUpscaleModalOpen] = useState(false)
  const [selectedImageForUpscale, setSelectedImageForUpscale] = useState<{ url: string; width?: number; height?: number } | null>(null)
  const [isUploadingPaste, setIsUploadingPaste] = useState(false)

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const addNode = useCallback((position: { x: number; y: number }, type: string = 'text', fileData?: { url: string; fileName: string; width?: number; height?: number }) => {
    const nodeLabels = {
      text: 'Text Node',
      image: 'Image Node',
      audio: 'Audio Node',
      video: 'Video Node',
    }
    
    // Calculate node dimensions
    let nodeWidth = 150
    let nodeHeight = 80
    
    if (type === 'audio') {
      nodeWidth = 200
      nodeHeight = 100
    } else if (type === 'video') {
      nodeWidth = 150
      nodeHeight = 120
    } else if (type === 'image' && fileData?.width && fileData?.height) {
      // Scale image to fit within reasonable bounds while maintaining aspect ratio
      const maxWidth = 400
      const maxHeight = 300
      const minWidth = 100
      const minHeight = 80
      
      const aspectRatio = fileData.width / fileData.height
      
      if (fileData.width > maxWidth || fileData.height > maxHeight) {
        if (aspectRatio > 1) {
          // Landscape
          nodeWidth = maxWidth
          nodeHeight = maxWidth / aspectRatio
        } else {
          // Portrait
          nodeHeight = maxHeight
          nodeWidth = maxHeight * aspectRatio
        }
      } else if (fileData.width < minWidth || fileData.height < minHeight) {
        if (aspectRatio > 1) {
          // Landscape
          nodeWidth = minWidth
          nodeHeight = minWidth / aspectRatio
        } else {
          // Portrait
          nodeHeight = minHeight
          nodeWidth = minHeight * aspectRatio
        }
      } else {
        // Use actual dimensions
        nodeWidth = fileData.width
        nodeHeight = fileData.height
      }
    }
    
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type: 'resizable',
      position,
      data: { 
        label: nodeLabels[type as keyof typeof nodeLabels] || 'Node',
        type,
        fileUrl: fileData?.url,
        fileName: fileData?.fileName
      },
      style: {
        background: type === 'text' ? '#ffffff' : 
                   type === 'image' ? '#f3f4f6' :
                   type === 'audio' ? '#dbeafe' :
                   type === 'video' ? '#fef3c7' : '#ffffff',
        border: '1px solid #d1d5db',
        width: nodeWidth,
        height: nodeHeight,
      }
    }
    setNodes((nds) => nds.concat(newNode))
  }, [setNodes])


  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (selectedTool === 'node') {
        const reactFlowBounds = event.currentTarget.getBoundingClientRect()
        const position = {
          x: event.clientX - reactFlowBounds.left - 75, // Center the node
          y: event.clientY - reactFlowBounds.top - 25,
        }
        addNode(position)
      }
    },
    [selectedTool, addNode],
  )


  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      setSelectedNodes(selectedNodes)
    },
    [setSelectedNodes],
  )

  // Handle generated image from modal
  const handleImageGenerated = useCallback((imageUrl: string, prompt: string) => {
    // Load image to get actual dimensions
    const img = new Image()
    img.onload = () => {
      // Calculate appropriate size while preserving aspect ratio
      const maxWidth = 400
      const maxHeight = 300
      const minWidth = 150
      const minHeight = 100
      
      let width = img.width
      let height = img.height
      const aspectRatio = width / height
      
      // Scale down if too large
      if (width > maxWidth || height > maxHeight) {
        if (aspectRatio > maxWidth / maxHeight) {
          width = maxWidth
          height = maxWidth / aspectRatio
        } else {
          height = maxHeight
          width = maxHeight * aspectRatio
        }
      }
      
      // Scale up if too small
      if (width < minWidth && height < minHeight) {
        if (aspectRatio > 1) {
          width = minWidth
          height = minWidth / aspectRatio
        } else {
          height = minHeight
          width = minHeight * aspectRatio
        }
      }
      
      // Get the center of the current viewport
      const viewport = getViewport()
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      
      // Convert screen center to flow position
      const flowPosition = screenToFlowPosition({
        x: centerX,
        y: centerY,
      })
      
      // Position node at center of viewport
      const position = {
        x: flowPosition.x - width / 2,
        y: flowPosition.y - height / 2,
      }

      const newNode: Node = {
        id: `generated-image-${Date.now()}`,
        type: 'resizable',
        position,
        data: { 
          label: `Generated: ${prompt.substring(0, 30)}...`,
          type: 'image',
          fileUrl: imageUrl,
          fileName: 'Generated Image',
          prompt: prompt
        },
        style: {
          background: '#f0f9ff',
          border: '2px solid #0ea5e9',
          width: Math.round(width),
          height: Math.round(height),
        }
      }
      
      setNodes((nds) => nds.concat(newNode))
    }
    
    img.onerror = () => {
      // Fallback to default size if image fails to load
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      
      // Convert screen center to flow position
      const flowPosition = screenToFlowPosition({
        x: centerX,
        y: centerY,
      })
      
      const position = {
        x: flowPosition.x - 100,
        y: flowPosition.y - 75,
      }

      const newNode: Node = {
        id: `generated-image-${Date.now()}`,
        type: 'resizable',
        position,
        data: { 
          label: `Generated: ${prompt.substring(0, 30)}...`,
          type: 'image',
          fileUrl: imageUrl,
          fileName: 'Generated Image',
          prompt: prompt
        },
        style: {
          background: '#f0f9ff',
          border: '2px solid #0ea5e9',
          width: 200,
          height: 150,
        }
      }
      
      setNodes((nds) => nds.concat(newNode))
    }
    
    img.src = imageUrl
  }, [setNodes, screenToFlowPosition, getViewport])

  // Handle edited image from modal
  const handleImageEdited = useCallback((imageUrl: string, prompt: string, replace: boolean) => {
    if (replace && selectedImagesForEdit && selectedImagesForEdit.length > 0) {
      // Find and replace the first selected node, keeping its size
      const selectedNode = nodes.find(node => 
        node.selected && node.data.type === 'image'
      )
      
      if (selectedNode) {
        setNodes((nds) => 
          nds.map(node => 
            node.id === selectedNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    fileUrl: imageUrl,
                    prompt: prompt,
                    label: `Edited: ${prompt.substring(0, 30)}...`
                  },
                  // Keep the existing size and position
                  style: {
                    ...node.style,
                    // Optionally update border to show it's edited
                    border: '2px solid #10b981',
                  }
                }
              : node
          )
        )
      }
    } else {
      // Add as new node with proper dimensions
      handleImageGenerated(imageUrl, `Edited: ${prompt}`)
    }
  }, [nodes, selectedImagesForEdit, setNodes, handleImageGenerated])

  // Handle opening edit modal for selected images
  const handleEditSelectedImage = useCallback(() => {
    const selectedImageNodes = nodes.filter(node => 
      node.selected && node.data.type === 'image' && node.data.fileUrl
    )
    
    if (selectedImageNodes.length === 0) {
      return
    }
    
    // Take up to 3 images (API limit)
    const imagesToEdit = selectedImageNodes.slice(0, 3).map(node => ({
      url: node.data.fileUrl,
      prompt: node.data.prompt || node.data.label || node.data.fileName || 'Untitled',
      width: node.style?.width as number | undefined,
      height: node.style?.height as number | undefined
    }))
    
    if (selectedImageNodes.length > 3) {
      console.log(`${selectedImageNodes.length} images selected, using first 3 due to API limit`)
    }
    
    setSelectedImagesForEdit(imagesToEdit)
    setIsEditModalOpen(true)
  }, [nodes])

  // Handle opening upscale modal for selected image
  const handleUpscaleSelectedImage = useCallback(() => {
    const selectedImageNode = nodes.find(node => 
      node.selected && node.data.type === 'image' && node.data.fileUrl
    )
    
    if (!selectedImageNode) {
      return
    }
    
    setSelectedImageForUpscale({
      url: selectedImageNode.data.fileUrl,
      width: selectedImageNode.style?.width as number | undefined,
      height: selectedImageNode.style?.height as number | undefined
    })
    setIsUpscaleModalOpen(true)
  }, [nodes])

  // Handle upscaled image from modal
  const handleImageUpscaled = useCallback((imageUrl: string, width: number, height: number) => {
    // Get the center of the current viewport
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    
    // Convert screen center to flow position
    const flowPosition = screenToFlowPosition({
      x: centerX,
      y: centerY,
    })
    
    // Position node at center of viewport
    const position = {
      x: flowPosition.x - width / 2,
      y: flowPosition.y - height / 2,
    }

    const newNode: Node = {
      id: `upscaled-image-${Date.now()}`,
      type: 'resizable',
      position,
      data: { 
        label: 'Upscaled Image',
        type: 'image',
        fileUrl: imageUrl,
        fileName: 'Upscaled Image'
      },
      style: {
        background: '#f0f9ff',
        border: '2px solid #22c55e',
        width: Math.round(width),
        height: Math.round(height),
      }
    }
    
    setNodes((nds) => nds.concat(newNode))
  }, [setNodes, screenToFlowPosition])

  // Handle download selected images
  const handleDownloadSelectedImages = useCallback(async () => {
    const selectedImageNodes = nodes.filter(node => 
      node.selected && node.data.type === 'image' && node.data.fileUrl
    )
    
    if (selectedImageNodes.length === 0) {
      return
    }
    
    try {
      if (selectedImageNodes.length === 1) {
        // Download single image
        const node = selectedImageNodes[0]
        const filename = node.data.fileName || node.data.label || `image-${Date.now()}.png`
        await downloadSingleImage(node.data.fileUrl, filename.endsWith('.png') ? filename : `${filename}.png`)
      } else {
        // Download multiple images as zip
        const images = selectedImageNodes.map((node, index) => ({
          url: node.data.fileUrl,
          name: node.data.fileName || node.data.label || `image-${index + 1}.png`
        }))
        await downloadMultipleImages(images, `canvas-images-${Date.now()}.zip`)
      }
    } catch (error) {
      console.error('Failed to download images:', error)
    }
  }, [nodes])

  // Handle paste event for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          
          const blob = item.getAsFile()
          if (!blob) continue

          setIsUploadingPaste(true)
          
          try {
            // Convert blob to File object with a name
            const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type })
            
            // Upload to R2
            const publicUrl = await uploadFileToR2(file)
            if (!publicUrl) {
              console.error('Failed to upload pasted image')
              setIsUploadingPaste(false)
              return
            }

            // Load image to get dimensions
            const img = new Image()
            img.onload = () => {
              // Get center of viewport
              const centerX = window.innerWidth / 2
              const centerY = window.innerHeight / 2
              
              // Convert screen center to flow position
              const flowPosition = screenToFlowPosition({
                x: centerX,
                y: centerY,
              })
              
              // Calculate center position
              const position = {
                x: flowPosition.x - img.width / 2,
                y: flowPosition.y - img.height / 2,
              }
              
              // Add to canvas with actual dimensions
              addNode(position, 'image', {
                url: publicUrl,
                fileName: file.name,
                width: img.width,
                height: img.height
              })
              
              setIsUploadingPaste(false)
            }
            
            img.onerror = () => {
              // Get center of viewport
              const centerX = window.innerWidth / 2
              const centerY = window.innerHeight / 2
              
              // Convert screen center to flow position
              const flowPosition = screenToFlowPosition({
                x: centerX,
                y: centerY,
              })
              
              // Fallback to default size
              const position = {
                x: flowPosition.x - 100,
                y: flowPosition.y - 75,
              }
              
              addNode(position, 'image', {
                url: publicUrl,
                fileName: file.name
              })
              
              setIsUploadingPaste(false)
            }
            
            img.src = publicUrl
          } catch (error) {
            console.error('Error handling pasted image:', error)
            setIsUploadingPaste(false)
          }
          
          break // Only handle the first image
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [addNode, screenToFlowPosition])

  // Check if any selected nodes are already shared
  const selectedNodeIds = new Set(nodes.filter(node => node.selected).map(node => node.id))
  const sharedNodeIds = new Set(sharedNodes.map(node => node.id))
  const hasSelectedNodes = selectedNodeIds.size > 0
  const hasUnsharedSelection = Array.from(selectedNodeIds).some(id => !sharedNodeIds.has(id))

  // Update nodes to show visual feedback for shared nodes
  const nodesWithSharedFeedback = nodes.map(node => ({
    ...node,
    style: {
      ...node.style,
      boxShadow: sharedNodeIds.has(node.id) ? '0 0 0 2px #3b82f6' : undefined,
      border: sharedNodeIds.has(node.id) ? '1px solid #3b82f6' : node.style?.border,
    }
  }))

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodesWithSharedFeedback}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode={['Meta', 'Shift']}
        panOnDrag={[1]} // Allow panning with left mouse only
        selectionKeyCode={'Shift'}
        selectNodesOnDrag={true}
        preventScrolling={false}
        fitView
        className="bg-gray-50"
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>

      {/* Toolbar Controls */}
      <ToolbarControls
        onGenerateImage={() => setIsGenerateModalOpen(true)}
        onEditImage={handleEditSelectedImage}
        onUpscaleImage={handleUpscaleSelectedImage}
        onDownloadImages={handleDownloadSelectedImages}
        hasSelectedImage={nodes.some(node => node.selected && node.data.type === 'image')}
        selectedImageCount={nodes.filter(node => node.selected && node.data.type === 'image').length}
      />

      {/* Upload Indicator for Paste */}
      {isUploadingPaste && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-sm px-4 py-2 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm">Uploading pasted image...</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <ImageGenerationModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onImageGenerated={handleImageGenerated}
      />
      
      {selectedImagesForEdit && (
        <ImageEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedImagesForEdit(null)
          }}
          selectedImages={selectedImagesForEdit}
          onImageEdited={handleImageEdited}
        />
      )}
      
      <ImageUpscaleModal
        isOpen={isUpscaleModalOpen}
        onClose={() => {
          setIsUpscaleModalOpen(false)
          setSelectedImageForUpscale(null)
        }}
        selectedImage={selectedImageForUpscale}
        onImageUpscaled={handleImageUpscaled}
      />
    </div>
  )
}

export function CanvasEditor() {
  return (
    <ReactFlowProvider>
      <CanvasEditorInner />
    </ReactFlowProvider>
  )
}