"use client"
import Image from "next/image"
import { Check, CheckCheck } from "lucide-react"
import type { Message } from "@/lib/chat-data"
import { formatTime } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: Message
  currentUser: string
  onImageClick: (src: string) => void
}

export default function ChatMessage({ message, currentUser, onImageClick }: ChatMessageProps) {
  const isOwnMessage = message.sender === currentUser

  const renderContent = () => {
    switch (message.type) {
      case "text":
        return <p className="text-base leading-relaxed break-words">{message.content}</p>
      case "image":
        return (
          <div className="cursor-pointer overflow-hidden rounded-lg" onClick={() => onImageClick(message.content)}>
            <Image
              src={message.content || "/placeholder.svg"}
              alt="Shared image"
              width={300}
              height={300}
              className="h-auto w-full max-w-[300px] object-cover transition-transform hover:scale-105"
              priority={false}
            />
          </div>
        )
      default:
        return <p className="text-sm text-gray-400 italic">Unsupported message type</p>
    }
  }

  const renderReadReceipt = () => {
    if (!isOwnMessage) return null;

    if (message.seen) {
      return <CheckCheck size={16} className="text-accent" />;
    }
    return <CheckCheck size={16} className="text-muted-foreground/70" />;
  };

  return (
    <div className={cn("mb-1 flex", isOwnMessage ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[80%] rounded-lg px-3 py-1.5 shadow-md",
          isOwnMessage
            ? "rounded-br-none bg-primary text-primary-foreground"
            : "rounded-bl-none bg-secondary text-secondary-foreground"
        )}
      >
        {renderContent()}
        <div className="mt-1 flex items-center justify-end space-x-1 pl-4">
          <span className="text-[10px] text-muted-foreground/80">{formatTime(message.timestamp)}</span>
          {renderReadReceipt()}
        </div>
      </div>
    </div>
  )
}
