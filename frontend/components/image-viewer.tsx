"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, useAnimation, useDragControls } from "framer-motion"

interface ImageViewerProps {
  src: string
  onClose: () => void
}

export default function ImageViewer({ src, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const controls = useDragControls()
  const constraintsRef = useRef<HTMLDivElement>(null)
  
  // Reset position and scale when the src changes
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [src])

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 5))
  }

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, 1)
      // If zooming out to 1, also reset position
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 })
      }
      return newScale
    })
  }

  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // Handle double tap to zoom
  const handleDoubleTap = () => {
    if (scale > 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setScale(2.5)
    }
  }

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={(e) => {
        // Close viewer when clicking outside the image
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute right-4 top-4 z-20 rounded-full bg-black/40 text-white hover:bg-black/60" 
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        <X size={24} />
      </Button>

      <div className="relative h-full w-full overflow-hidden" ref={constraintsRef}>
        <motion.div
          drag={scale > 1}
          dragControls={controls}
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          whileDrag={{ cursor: "grabbing" }}
          style={{ 
            x: position.x,
            y: position.y
          }}
          animate={{ scale }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            scale: { duration: 0.2 }
          }}
          onDoubleClick={handleDoubleTap}
          className="flex h-full w-full items-center justify-center"
        >
          <Image
            src={src || "/placeholder.svg"}
            alt="Fullscreen image"
            width={1200}
            height={1200}
            className="h-auto max-h-[90vh] w-auto max-w-[90vw] object-contain select-none"
            priority
            draggable={false}
            style={{ touchAction: scale > 1 ? "none" : "auto" }}
          />
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 space-x-4">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-0 bg-black/40 text-white hover:bg-black/60"
          onClick={handleZoomOut}
          disabled={scale <= 1}
        >
          <ZoomOut size={20} />
        </Button>
        <Button 
          variant="outline" 
          className="h-10 rounded-full border-0 bg-black/40 text-white hover:bg-black/60 px-4"
          onClick={handleReset}
        >
          <RotateCcw size={16} className="mr-2" /> Reset
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-0 bg-black/40 text-white hover:bg-black/60"
          onClick={handleZoomIn}
          disabled={scale >= 5}
        >
          <ZoomIn size={20} />
        </Button>
      </div>
    </motion.div>
  )
}
