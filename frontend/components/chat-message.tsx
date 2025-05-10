"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Copy, Check, MessageSquare, Recycle, CheckCheck, Trash2, X } from "lucide-react"
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
  userRole?: 'akash' | 'divyangini'
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
  userRole = 'divyangini',
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteButton, setShowDeleteButton] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const messageRef = useRef<HTMLDivElement>(null)
  
  const isUser = message.sender === currentUser
  const displayName = isUser ? "You" : aiName || message.sender

  // Track if seen status is visible for animation
  const [seenVisible, setSeenVisible] = useState(false)

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
  
  // --- Press and Hold Logic --- 
  const startLongPressTimer = (e?: React.TouchEvent | React.MouseEvent) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setShowDeleteButton(true);
      // Prevent context menu on long press (desktop)
      if (e && 'preventDefault' in e) e.preventDefault(); 
    }, 3000); // 3 seconds
  };

  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isUser || !onDeleteMessage) return;
    startLongPressTimer(e);
  };

  const handleMouseUp = () => {
    clearLongPressTimer();
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
     if (!isUser || !onDeleteMessage) return;
     startLongPressTimer(e);
  };
  
  const handleTouchEnd = () => {
     clearLongPressTimer();
  };
  
  // Cancel timer if mouse leaves the element while pressing
  const handleMouseLeave = () => {
     clearLongPressTimer();
  };
  
  // Cancel timer if touch moves significantly
  const handleTouchMove = (e: React.TouchEvent) => {
    // Basic check: if touch moves more than a few pixels, cancel timer
    // A more robust solution might track initial touch position
    clearLongPressTimer();
  };

  // --- Delete Action --- 
  const handleDelete = () => {
    if (isUser && onDeleteMessage) {
      setIsDeleting(true)
      // Hide button immediately for smoother animation
      setShowDeleteButton(false);
      setTimeout(() => {
        onDeleteMessage(message.clientId || message.id)
      }, 300) // Animation duration
    }
  };
  
  // Hide delete button if clicking outside
  useEffect(() => {
    if (!showDeleteButton) return;
    
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowDeleteButton(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showDeleteButton]);

  return (
    <div
      ref={messageRef} // Ref for detecting outside clicks
      className={cn(
        "group mb-1 flex w-full origin-bottom transition-all duration-300 ease-in-out will-change-transform will-change-opacity",
        isUser ? "justify-end" : "justify-start",
        isDeleting 
          ? "scale-90 opacity-0 translate-y-2" 
          : "scale-100 opacity-100 animate-message-in"
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave} // Clear timer if mouse leaves
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove} // Clear timer if touch moves
      onContextMenu={(e) => { 
        // Prevent default only if the delete button is about to show or shown
        if (showDeleteButton || longPressTimer.current) e.preventDefault(); 
      }}
    >
      <div className={cn("flex flex-col relative", isUser ? "items-end" : "items-start")}>
        {/* Delete Button - positioned absolutely */} 
        {showDeleteButton && isUser && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-4 -right-2 h-7 w-7 rounded-full z-10 shadow-lg"
            onClick={(e) => { 
              e.stopPropagation(); // Prevent triggering message click
              handleDelete(); 
            }}
          >
            <Trash2 size={14} />
          </Button>
        )}
        
        {/* Message Bubble */} 
        <div
          style={{ willChange: 'transform, opacity' }}
          className={cn(
            "relative inline-block rounded-[20px] text-base max-w-[80vw] lg:max-w-lg transition-transform duration-200", // Changed from text-lg to text-base
            isUser
              ? userRole === 'akash' 
                ? "bg-blue-600 text-white" // Blue bubbles for Akash
                : "bg-primary text-primary-foreground" // Default purple for Divyangini
              : "bg-card text-foreground shadow-sm border border-border/30",
            message.type === 'image' ? 'p-0 overflow-hidden' : 'px-4 py-2',
            // Apply slight scale effect when delete button is shown
            showDeleteButton && isUser ? "scale-[0.98]" : "scale-100"
          )}
        >
          {/* Message Content (Text or Image) */}
          {message.type === "image" ? (
            <div className="cursor-pointer relative" onClick={handleImageClick}>
              <Image
                src={message.content}
                alt="Shared image"
                width={250}
                height={250}
                className="max-w-full h-auto rounded-md object-cover"
              />
            </div>
          ) : (
            <span className="whitespace-pre-wrap break-words">{message.content}</span>
          )}
        </div>
        
        {/* Seen Status - Modified with dull white color */} 
        {isUser && isLastSeenByOther && message.seen && (
          <div className="h-5 mt-0.5 text-sm overflow-hidden">
            <span 
              className={cn(
                "text-sm flex items-center transition-opacity duration-200 pr-3 text-gray-400",
                seenVisible ? "opacity-100" : "opacity-0"
              )}
            >
              Seen
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
