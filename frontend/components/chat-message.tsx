"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Copy, Check, MessageSquare, Recycle, CheckCheck, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Message } from "@/lib/chat-data"
import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/utils"

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
  isLastSeenByOther?: boolean
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
  isLastSeenByOther,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [isLongPress, setIsLongPress] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  // Track if seen status is visible for animation
  const [seenVisible, setSeenVisible] = useState(false)

  const isUser = message.sender === currentUser
  const displayName = isUser ? "You" : aiName || message.sender

  // Handle smooth transition for seen status
  useEffect(() => {
    // If this is the last seen message by the other user
    if (isUser && isLastSeenByOther && message.seen) {
      // Slight delay to ensure the message is rendered first
      const timer = setTimeout(() => {
        setSeenVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSeenVisible(false);
    }
  }, [isUser, isLastSeenByOther, message.seen]);

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
    }, 5000)
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
    }, 5000)
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
        {/* Only render the seen container when needed and make it compact */}
        {isUser && isLastSeenByOther && message.seen && (
          <div className="h-4 mt-0.5 text-xs overflow-hidden">
            <span 
              className={cn(
                "text-xs text-muted-foreground flex items-center transition-opacity duration-200",
                seenVisible ? "opacity-100" : "opacity-0"
              )}
            >
              Seen {formatTime(message.timestamp)}
              <CheckCheck size={12} className="ml-1 text-primary" />
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
