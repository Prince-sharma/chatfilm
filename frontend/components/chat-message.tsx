"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Copy, Check, MessageSquare, Recycle, CheckCheck, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Message } from "@/lib/chat-data"
import { Button } from "@/components/ui/button"

interface ChatMessageProps {
  message: Message
  currentUser: string
  onImageClick?: (src: string) => void
  aiName?: string
  aiImage?: string
  onRegenerate?: (id: string) => void
  isLoadingRegenerate?: boolean
  regeneratingId?: string
  onDeleteMessage?: (id: string) => void
}

export default function ChatMessage({
  message,
  currentUser,
  onImageClick,
  aiName,
  aiImage,
  onRegenerate,
  isLoadingRegenerate = false,
  regeneratingId,
  onDeleteMessage,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [isLongPress, setIsLongPress] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const [showSeen, setShowSeen] = useState(false)
  const previousSeenStatus = useRef(message.seen)

  const isUser = message.sender === currentUser
  const displayName = isUser ? "You" : aiName || message.sender

  useEffect(() => {
    if (message.seen && !previousSeenStatus.current && isUser) {
      setShowSeen(true)
      const timer = setTimeout(() => {
        setShowSeen(false)
      }, 1500)

      previousSeenStatus.current = true

      return () => clearTimeout(timer)
    }
    if (message.seen !== previousSeenStatus.current) {
      previousSeenStatus.current = message.seen
    }
  }, [message.seen, isUser])

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isLoading = regeneratingId === message.id && isLoadingRegenerate

  const handleImageClick = () => {
    if (message.type === "image" && onImageClick) {
      onImageClick(message.content)
    }
  }

  // Long press handlers
  const handleMouseDown = () => {
    if (!isUser) return
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true)
    }, 500)
  }

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (isLongPress) {
      handleDelete()
      setIsLongPress(false)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isUser) return
    // Prevent scroll on long press
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
    
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true)
      e.preventDefault() // Prevent default touch actions once long press is detected
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (isLongPress) {
      handleDelete()
      setIsLongPress(false)
    }
  }

  // Cancel timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  const handleDelete = () => {
    if (isUser && onDeleteMessage) {
      setIsDeleting(true)
      setTimeout(() => {
        onDeleteMessage(message.id)
      }, 300)
    }
  }

  return (
    <div
      className={cn(
        "group mb-2 flex w-full origin-bottom transition-all duration-300 ease-in-out will-change-transform will-change-opacity",
        isUser ? "justify-end" : "justify-start",
        isDeleting 
          ? "scale-90 opacity-0 translate-y-2" 
          : "scale-100 opacity-100 animate-message-in"
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => { if (isLongPress) e.preventDefault() }}
    >
      <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
        <div
          style={{ willChange: 'transform, opacity' }}
          className={cn(
            "relative inline-block rounded-[18px] text-base max-w-[80vw] lg:max-w-lg",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card text-foreground shadow-sm border border-border/30",
            message.type === 'image' ? 'p-0 overflow-hidden' : 'px-3 py-[7px]',
            isLongPress && isUser ? "ring-2 ring-destructive ring-offset-2 ring-offset-background" : ""
          )}
        >
          {message.type === "image" ? (
            <div className="cursor-pointer relative" onClick={handleImageClick}>
              <Image
                src={message.content}
                alt="Shared image"
                width={300}
                height={300}
                className="max-w-full h-auto rounded-md object-cover"
              />
            </div>
          ) : (
            <span className="whitespace-pre-wrap break-words">{message.content}</span>
          )}
          {isLongPress && isUser && (
            <div className="absolute -top-2 -left-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg">
              <Trash2 size={12} />
            </div>
          )}
        </div>
        {isUser && showSeen && (
          <span className="text-xs text-muted-foreground mt-1">Seen</span>
        )}
      </div>
    </div>
  )
}
