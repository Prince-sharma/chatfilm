"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Camera,
  ArrowLeft,
  MoreVertical,
  BellOff,
  Bell,
  SendHorizontal
} from "lucide-react"
import ChatMessage from "@/components/chat-message"
import ImageViewer from "@/components/image-viewer"
import { useRealTimeChat } from "@/hooks/use-real-time-chat"
import ChatBackground from "@/components/chat-background"
import { cn } from "@/lib/utils"

type ValidRole = 'akash' | 'divyangini'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const roleParam = params.role as string

  // Validate role
  useEffect(() => {
    if (roleParam !== 'akash' && roleParam !== 'divyangini') {
      console.error("Invalid role specified in URL:", roleParam)
      router.replace("/"); // Redirect to home or an error page
    }
  }, [roleParam, router])

  // Return null or a loading state while validating/redirecting
  if (roleParam !== 'akash' && roleParam !== 'divyangini') {
    return null; // Or a loading spinner
  }

  // Cast to the validated type
  const role = roleParam as ValidRole;
  const otherPerson = role === "akash" ? "divyangini" : "akash"

  const {
    messages,
    isTyping,
    isMuted,
    setIsMuted,
    newMessage,
    setNewMessage,
    sendMessage,
    sendImage,
    markAsSeen,
    isConnected,
    deleteMessage,
  } = useRealTimeChat(role, otherPerson)

  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => {
    scrollToBottom("auto")
  }, [messages, scrollToBottom])

  const handleInputFocus = () => {
    setIsKeyboardOpen(true)
    setTimeout(() => scrollToBottom('smooth'), 100)
  }

  const handleInputBlur = () => {
    setIsKeyboardOpen(false)
  }

  useEffect(() => {
    if (!chatContainerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute("data-message-id")
            const sender = entry.target.getAttribute("data-sender")
            if (messageId && sender === otherPerson) {
              markAsSeen(messageId)
            }
          }
        })
      },
      {
        root: chatContainerRef.current,
        rootMargin: "0px",
        threshold: 0.8,
      }
    )

    const messageElements = chatContainerRef.current.querySelectorAll(`[data-message-id][data-sender="${otherPerson}"]`)
    messageElements.forEach((el) => observer.observe(el))

    return () => {
      messageElements.forEach((el) => observer.unobserve(el))
    }
  }, [messages, markAsSeen, otherPerson])

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          sendImage(event.target.result.toString())
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileClick = () => {
    router.push(`/profile/${otherPerson}`)
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage()
      inputRef.current?.focus()
    }
  }

  const handleDeleteMessage = (messageId: string) => {
    // Call the hook's delete function and handle optimistic UI updates
    if (messageId) {
      console.log(`Deleting message with ID: ${messageId}`);
      deleteMessage(messageId);
      
      // Focus back on the input field after deletion for better UX
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-card p-3 shadow-md">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2 text-foreground/80 hover:bg-secondary" onClick={() => router.push("/")}>
            <ArrowLeft size={24} />
          </Button>
          <div className="flex cursor-pointer items-center" onClick={handleProfileClick}>
            <div className="relative h-10 w-10">
              <Image
                src={`https://ui-avatars.com/api/?name=${otherPerson}&background=random&color=fff&size=40`}
                alt={otherPerson}
                className="rounded-full object-cover"
                width={40}
                height={40}
              />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold capitalize text-foreground">{otherPerson}</h2>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="text-foreground/80 hover:bg-secondary" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <BellOff size={20} className="text-destructive" /> : <Bell size={20} className="text-accent"/>}
          </Button>
          <Button variant="ghost" size="icon" className="text-foreground/80 hover:bg-secondary">
            <MoreVertical size={20} />
          </Button>
        </div>
      </header>

      <div ref={chatContainerRef} className="relative flex-1 overflow-y-auto p-3 sm:p-4">
        <ChatBackground role={role} />
        <div className="relative z-10 space-y-1.5 pb-3 sm:pb-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              data-message-id={message.id} 
              data-sender={message.sender}
              className="transition-all duration-300 ease-in-out"
            >
              <ChatMessage 
                message={message} 
                currentUser={role} 
                onImageClick={setViewingImage}
                onDeleteMessage={handleDeleteMessage} 
              />
            </div>
          ))}
          {isTyping && (
            <div className={`flex justify-start animate-pulse`}>
              <div className="ml-2 rounded-full bg-secondary px-4 py-2 shadow-md">
                <div className="flex items-center space-x-1">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"></div>
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center border-t border-border bg-card p-2 sm:p-3">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 h-12 w-12 flex-shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform duration-200"
          onClick={handleCameraClick}
          aria-label="Take a photo"
        >
          <Camera size={22} />
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </Button>

        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Message..."
            className="w-full rounded-full border-border bg-input py-4 pl-4 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            onFocus={handleInputFocus}
            autoComplete="off"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="ml-2 h-12 w-12 flex-shrink-0 rounded-full bg-primary text-primary-foreground transition-all duration-200 hover:bg-primary/90 disabled:opacity-50 active:scale-95 disabled:active:scale-100"
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || !isConnected}
          aria-label="Send message"
        >
          <SendHorizontal size={24} />
        </Button>
      </div>

      {viewingImage && <ImageViewer src={viewingImage} onClose={() => setViewingImage(null)} />}
    </div>
  )
}
