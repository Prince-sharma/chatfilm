"use client"

import React, { useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Copy, Check, MessageSquare, Recycle, CheckCheck } from "lucide-react"
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
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = message.sender === currentUser
  const displayName = isUser ? "You" : aiName || message.sender

  const isLoading = regeneratingId === message.id && isLoadingRegenerate

  const handleImageClick = () => {
    if (message.type === "image" && onImageClick) {
      onImageClick(message.content)
    }
  }

  return (
    <div
      className={cn(
        "group mb-2 flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "relative flex flex-col rounded-md text-sm sm:text-base w-fit max-w-[75%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-foreground shadow-sm border border-border/30",
          message.type === 'image' ? 'p-0 overflow-hidden' : 'px-2.5 py-1.5'
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
            <div className="absolute bottom-1 right-1.5 flex items-center justify-end gap-1 rounded-full bg-black/30 px-1.5 py-0.5 text-[10px] text-white/90">
              <span>{format(new Date(message.timestamp), "h:mm a")}</span>
              {isUser && (
                <CheckCheck size={14} className={cn(message.seen ? "text-blue-400" : "text-white/70")} />
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-x-2">
            <span className="whitespace-pre-wrap break-words">{message.content}</span>
            <span className="relative -bottom-0.5 ml-2 flex flex-shrink-0 items-center justify-end self-end text-[10px]">
              <span className={cn("whitespace-nowrap", isUser ? "text-primary-foreground/70" : "text-muted-foreground/80")}>
                {format(new Date(message.timestamp), "h:mm a")}
              </span>
              {isUser && (
                <CheckCheck size={14} className={cn("ml-0.5 flex-shrink-0", message.seen ? "text-blue-400" : "text-primary-foreground/50")} />
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
