"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageViewerProps {
  src: string
  onClose: () => void
}

export default function ImageViewer({ src, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 5))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.5, 1))
  }

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
      setDragStart({ x: clientX - position.x, y: clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging && scale > 1) {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
      setPosition({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      onTouchCancel={handleMouseUp}
      onTouchMove={handleMouseMove}
    >
      <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-white" onClick={onClose}>
        <X size={24} />
      </Button>

      <div
        className="relative overflow-hidden"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{ cursor: scale > 1 ? "grab" : "default" }}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.3s ease",
          }}
        >
          <Image
            src={src || "/placeholder.svg"}
            alt="Fullscreen image"
            width={800}
            height={800}
            className="max-h-[80vh] max-w-[90vw] object-contain"
          />
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 space-x-4">
        <Button
          variant="outline"
          size="icon"
          className="bg-gray-800/70 text-white hover:bg-gray-700/70"
          onClick={handleZoomOut}
          disabled={scale <= 1}
        >
          -
        </Button>
        <Button variant="outline" className="bg-gray-800/70 text-white hover:bg-gray-700/70" onClick={handleReset}>
          Reset
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-gray-800/70 text-white hover:bg-gray-700/70"
          onClick={handleZoomIn}
          disabled={scale >= 5}
        >
          +
        </Button>
      </div>
    </div>
  )
}
