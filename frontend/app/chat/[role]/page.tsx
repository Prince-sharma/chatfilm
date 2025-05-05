"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
import { formatTime } from "@/lib/utils"
import { v4 as uuidv4 } from 'uuid'
import DaySeparator from "@/components/day-separator"
import DaySeparatorDialog from "@/components/day-separator-dialog"

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
    setMessages,
  } = useRealTimeChat(role, otherPerson)

  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [clickCount, setClickCount] = useState(0);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const [clickPosition, setClickPosition] = useState<{top: number, left: number} | null>(null);
  const [insertPosition, setInsertPosition] = useState<number | null>(null);
  const [separatorDialogOpen, setSeparatorDialogOpen] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkIsMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsMobile(checkIsMobile);
    }
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  // Enhanced scroll behavior
  useEffect(() => {
    // Use instant scroll for first load, smooth for updates
    const behavior = messages.length <= 1 ? "auto" : "smooth";
    scrollToBottom(behavior);
    
    // For mobile, make sure we handle the virtual keyboard properly
    if (isMobile) {
      // Small delay to let keyboard appear/layout adjust before scrolling
      const timer = setTimeout(() => {
        scrollToBottom("smooth");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [messages, scrollToBottom, isMobile])

  const handleInputFocus = () => {
    setIsKeyboardOpen(true)
    // Delay scrolling to bottom to account for keyboard appearance
    setTimeout(() => scrollToBottom('smooth'), isMobile ? 300 : 100)
  }

  const handleInputBlur = () => {
    // Only change keyboard state if we're not on mobile or if explicitly requested
    if (!isMobile) {
      setIsKeyboardOpen(false)
    }
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
    const file = e.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name, file.type, file.size);
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (event.target?.result) {
            console.log("File read successfully, sending image...");
            sendImage(event.target.result.toString());
            // Keep focus after sending image
            if (isMobile) {
              requestAnimationFrame(() => {
                textareaRef.current?.focus();
              });
            }
          } else {
            console.error("FileReader onload event target result is null");
          }
        } catch (error) {
           console.error("Error sending image after reading:", error);
        } finally {
          if (fileInputRef.current) {
            fileInputRef.current.value = ""; 
          }
        }
      };
      
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };

      try {
        console.log("Attempting to read file as DataURL...");
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error initiating file read:", error);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } else {
      console.log("No file selected or selection cancelled.");
       if (fileInputRef.current) {
         fileInputRef.current.value = "";
       }
    }
  };

  const handleProfileClick = () => {
    router.push(`/profile/${otherPerson}`)
  }

  // Keyboard focus management for mobile devices
  useEffect(() => {
    if (!isMobile || !textareaRef.current) return;
    
    // Keep keyboard up at all times on mobile by maintaining focus
    const maintainFocus = () => {
      if (document.activeElement !== textareaRef.current) {
        textareaRef.current?.focus();
      }
    };
    
    // Set initial focus
    maintainFocus();
    
    // Maintain focus after sending a message
    const focusInterval = setInterval(maintainFocus, 300);
    
    // Re-focus when device becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(maintainFocus, 100);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(focusInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMobile]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Clear input field first for immediate feedback
      const msgToSend = newMessage.trim();
      setNewMessage('');
      
      // Focus immediately before any UI updates
      if (isMobile) {
        textareaRef.current?.focus();
      }
      
      // Then send the message
      sendMessage();
      
      // Ensure the textarea remains focused after message is sent
      if (isMobile) {
        // Use multiple strategies to maintain focus
        requestAnimationFrame(() => {
          textareaRef.current?.focus();
          // Double-ensure focus with a slight delay
          setTimeout(() => textareaRef.current?.focus(), 10);
        });
      }
    }
  }

  const handleDeleteMessage = (messageId: string) => {
    if (messageId) {
      console.log(`Deleting message with ID: ${messageId}`);
      deleteMessage(messageId);
      
      // Focus back on the input field after deletion
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }

  // Auto-resize Textarea height and adjust border radius dynamically
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto first to shrink properly if text is deleted
      textareaRef.current.style.height = 'auto';
      // Set min-height to match the screenshot
      const minHeight = 40; // Initial height for empty or short messages
      
      // Calculate new height without max limit
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.max(minHeight, scrollHeight);
      textareaRef.current.style.height = `${newHeight}px`;
      
      // Dynamically adjust border radius based on height
      // Start with full rounded (24px) for short messages
      // Gradually decrease to a minimum radius (8px) as the message gets longer
      const textareaParent = textareaRef.current.parentElement;
      if (textareaParent) {
        // Determine how "tall" the message is
        const heightRatio = Math.min(1, minHeight / newHeight); // 1 for short, approaching 0 for very tall
        
        // Calculate border radius: from 9999px (pill) to 12px (rounded rectangle)
        // Using 'rounded-full' (9999px) for short messages, reducing for longer ones
        const maxRadius = 9999; // Full rounded initially (rounded-full)
        const minRadius = 12;   // Minimum radius for tall messages
        
        // Apply a more dramatic curve to the transition
        const radiusReduction = Math.pow(1 - heightRatio, 2); // Squared curve for smoother transition
        const newRadius = maxRadius - (radiusReduction * (maxRadius - minRadius));
        
        // Apply the calculated radius to the textarea
        textareaRef.current.style.borderRadius = `${Math.min(newRadius, 9999)}px`;
      }
    }
  }, [newMessage]); // Re-run when message changes

  // Clear click count after delay
  const handleClickArea = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    
    // Update click position
    setClickPosition({
      top: e.clientY,
      left: e.clientX
    });
    
    // Set insert position between current and next message
    setInsertPosition(index);
    
    // Increment click count
    setClickCount(prev => prev + 1);
    
    // Clear any existing timeout
    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }
    
    // Set new timeout to reset click count
    const timeout = setTimeout(() => {
      setClickCount(0);
    }, 500); // Reset after 500ms if no more clicks
    
    setClickTimeout(timeout);
    
    // Check for triple click
    if (clickCount === 2) { // This will make it 3 with the increment above
      setSeparatorDialogOpen(true);
      setClickCount(0);
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    }
  };
  
  // Handle day separator insertion
  const handleAddDaySeparator = (text: string) => {
    if (insertPosition === null) return;
    
    const newSeparator = {
      id: uuidv4(),
      sender: 'system',
      content: text,
      timestamp: new Date().toISOString(),
      seen: true,
      type: 'day-separator' as const
    };
    
    // Insert the day separator locally
    const updatedMessages = [...messages];
    updatedMessages.splice(insertPosition + 1, 0, newSeparator);
    
    // Update messages in state directly since this is a UI-only feature
    // and doesn't need to be synced with other clients
    setMessages(updatedMessages);
  };
  
  // Handle separator deletion
  const handleDeleteSeparator = (separatorId: string) => {
    // Filter out the separator with the specified ID
    const updatedMessages = messages.filter(message => message.id !== separatorId);
    setMessages(updatedMessages);
  };
  
  // Handle separator dragging
  const handleSeparatorDrag = (separatorId: string, clientY: number) => {
    // Find the separator index
    const separatorIndex = messages.findIndex(msg => msg.id === separatorId);
    if (separatorIndex === -1) return;
    
    // Get the separator element
    const separatorElement = document.querySelector(`[data-separator-id="${separatorId}"]`);
    if (!separatorElement) return;
    
    // Find the new position based on clientY
    const messageElements = Array.from(document.querySelectorAll('[data-message-id]'));
    let targetIndex = -1;
    
    // Find the message element below the dragged position
    for (let i = 0; i < messageElements.length; i++) {
      const rect = messageElements[i].getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      
      if (clientY < midpoint) {
        targetIndex = messages.findIndex(msg => msg.id === messageElements[i].getAttribute('data-message-id'));
        break;
      }
    }
    
    // If we didn't find a target, place at end
    if (targetIndex === -1) {
      targetIndex = messages.length - 1;
    }
    
    // Don't move if the position didn't change or if it would be adjacent to another separator
    if (
      targetIndex === separatorIndex || 
      targetIndex === separatorIndex - 1 || 
      (messages[targetIndex]?.type === 'day-separator') || 
      (targetIndex > 0 && messages[targetIndex - 1]?.type === 'day-separator')
    ) {
      return;
    }
    
    // Move the separator
    const updatedMessages = [...messages];
    const [removedSeparator] = updatedMessages.splice(separatorIndex, 1);
    
    // Insert at the new position
    const insertAt = targetIndex > separatorIndex ? targetIndex - 1 : targetIndex;
    updatedMessages.splice(insertAt, 0, removedSeparator);
    
    setMessages(updatedMessages);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex flex-shrink-0 items-center justify-between border-b border-border bg-card p-4 shadow-md">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2 text-foreground/80 hover:bg-secondary" onClick={() => router.push("/")}>
            <ArrowLeft size={26} />
          </Button>
          <div className="flex cursor-pointer items-center" onClick={handleProfileClick}>
            <div className="relative h-11 w-11">
              <Image
                src={`https://ui-avatars.com/api/?name=${otherPerson}&background=random&color=fff&size=44`}
                alt={otherPerson}
                className="rounded-full object-cover"
                width={44}
                height={44}
              />
            </div>
            <div className="ml-3">
              <h2 className="text-xl font-semibold capitalize text-foreground">{otherPerson}</h2>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "text-foreground/80 hover:bg-secondary rounded-full p-2",
              isMuted && "bg-destructive/80 hover:bg-destructive text-destructive-foreground"
            )}
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <BellOff size={22} /> : <Bell size={22} />}
          </Button>
        </div>
      </header>

      <div 
        ref={chatContainerRef} 
        className="relative flex-1 overflow-y-auto p-3 pb-1 sm:p-4"
      >
        <ChatBackground role={role} />
        <div className="relative z-10 space-y-1 pb-1">
          {(() => {
            let lastSeenIndex = -1;
            let lastUserMessageIndex = -1;
            let lastOtherPersonMessageIndex = -1;
            
            // First, find the last message from the current user
            for (let i = messages.length - 1; i >= 0; i--) {
              if (messages[i].sender === role && messages[i].type !== 'day-separator') {
                lastUserMessageIndex = i;
                break;
              }
            }
            
            // Find the last message from the other person
            for (let i = messages.length - 1; i >= 0; i--) {
              if (messages[i].sender === otherPerson && messages[i].type !== 'day-separator') {
                lastOtherPersonMessageIndex = i;
                break;
              }
            }
            
            // Then find the last seen message from the current user
            for (let i = messages.length - 1; i >= 0; i--) {
              if (messages[i].sender === role && messages[i].seen && messages[i].type !== 'day-separator') {
                lastSeenIndex = i;
                break;
              }
            }
            
            // Only show "Seen" if:
            // 1. The last seen message is also the last message from the user in the conversation
            // 2. There are no messages from the other person after this seen message
            const validLastSeenIndex = 
              lastSeenIndex === lastUserMessageIndex && 
              (lastOtherPersonMessageIndex === -1 || lastOtherPersonMessageIndex < lastSeenIndex) 
                ? lastSeenIndex 
                : -1;

            return messages.map((message, index) => (
              <React.Fragment key={message.id}>
                {/* Render based on message type */}
                {message.type === 'day-separator' ? (
                  <div data-separator-id={message.id}>
                    <DaySeparator 
                      text={message.content} 
                      onDelete={() => handleDeleteSeparator(message.id)}
                      onDragEnd={(clientY) => handleSeparatorDrag(message.id, clientY)}
                    />
                  </div>
                ) : (
                  <div 
                    data-message-id={message.id} 
                    data-sender={message.sender}
                    className="transition-all duration-300 ease-in-out"
                  >
                    <ChatMessage 
                      message={message} 
                      currentUser={role} 
                      onImageClick={setViewingImage}
                      onDeleteMessage={handleDeleteMessage} 
                      isLastSeenByOther={index === validLastSeenIndex} 
                    />
                  </div>
                )}
                
                {/* Area between messages for triple-click */}
                {index < messages.length - 1 && (
                  <div 
                    className={cn(
                      "h-1 w-full cursor-pointer transition-colors duration-200",
                      clickCount > 0 && insertPosition === index ? "bg-muted/40 hover:bg-muted/50" : "hover:bg-muted/30"
                    )}
                    onClick={(e) => handleClickArea(e, index)}
                  />
                )}
              </React.Fragment>
            ));
          })()}
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
          <div ref={messagesEndRef} className="h-0.5" />
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center border-t border-border bg-card p-2 sm:p-3">
        <Button
          variant="ghost"
          size="icon"
          className="mr-1 h-12 w-12 flex-shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform"
          onClick={handleCameraClick}
          aria-label="Take a photo"
        >
          <Camera size={24} />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </Button>

        <div className="relative flex-1 mx-1">
          <Textarea
            ref={textareaRef}
            rows={1}
            placeholder="Message..."
            className="w-full border bg-input py-2 px-4 text-lg text-foreground placeholder:text-muted-foreground resize-none overflow-hidden focus:outline-none focus-visible:outline-none focus:border-input focus:bg-input min-h-[44px] leading-normal transition-all duration-200"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            autoComplete="off"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="ml-1 h-12 w-12 flex-shrink-0 rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform"
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || !isConnected}
          aria-label="Send message"
        >
          <SendHorizontal size={24} />
        </Button>
      </div>

      {/* Day separator dialog */}
      <DaySeparatorDialog 
        open={separatorDialogOpen}
        onOpenChange={setSeparatorDialogOpen}
        onConfirm={handleAddDaySeparator}
      />
      
      {viewingImage && <ImageViewer src={viewingImage} onClose={() => setViewingImage(null)} />}
    </div>
  )
}
