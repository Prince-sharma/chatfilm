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
  SendHorizontal,
  ImageIcon,
  Plus
} from "lucide-react"
import ChatMessage from "@/components/chat-message"
import ImageViewer from "@/components/image-viewer"
import { useRealTimeChat } from "@/hooks/use-real-time-chat"
import ChatBackground from "@/components/chat-background"
import { cn } from "@/lib/utils"
import { formatTime } from "@/lib/utils"
import { v4 as uuidv4 } from 'uuid'
import imageCompression from 'browser-image-compression'
import DaySeparator from "@/components/day-separator"
import DaySeparatorDialog from "@/components/day-separator-dialog"
import { type Message } from "@/lib/chat-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import MuteAnimation from "@/components/mute-animation"

type ValidRole = 'akash' | 'divyangini'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const roleParam = params.role as string
  const [newMessage, setNewMessage] = useState("")

  // Validate role
  useEffect(() => {
    if (roleParam !== 'akash' && roleParam !== 'divyangini') {
      console.error("Invalid role specified in URL:", roleParam)
      router.replace("/")
    }
  }, [roleParam, router])

  // Return null or a loading state while validating/redirecting
  if (roleParam !== 'akash' && roleParam !== 'divyangini') {
    return null
  }

  // Cast to the validated type
  const role = roleParam as ValidRole;
  const otherPerson = role === "akash" ? "divyangini" : "akash"

  const {
    messages,
    isTyping,
    isMuted,
    setIsMuted,
    sendMessage,
    sendImage,
    markAsSeen,
    isConnected,
    deleteMessage,
    setMessages,
    startTyping,
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
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [showMuteAnimation, setShowMuteAnimation] = useState(false);
  const [isMuting, setIsMuting] = useState(false);
  const [showDivider, setShowDivider] = useState<number | null>(null);
  const dividerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Enhanced keyboard handling for mobile
  useEffect(() => {
    if (!isMobile || !textareaRef.current) return;
    
    // Function to help maintain keyboard focus and adjust layout
    const maintainFocus = () => {
      // Only refocus if the document is active and keyboard should be shown
      if (document.visibilityState === 'visible' && 
          document.activeElement !== textareaRef.current &&
          isKeyboardOpen) {
        
        // Get current viewport dimensions
        const viewportHeight = window?.visualViewport?.height || window.innerHeight;
        const windowHeight = window.innerHeight;
        const keyboardHeight = windowHeight - viewportHeight;
        
        // If the keyboard appears to be closed (less than 100px difference)
        // Don't force it back open
        if (Math.abs(viewportHeight - windowHeight) < 100) {
          return;
        }
        
        // Otherwise maintain focus and adjust layout
        requestAnimationFrame(() => {
          if (isKeyboardOpen) {
            textareaRef.current?.focus();
            scrollToBottom('smooth');
          }
        });
      }
    };
    
    // Listen for visibility changes to handle app switching
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isKeyboardOpen) {
        setTimeout(maintainFocus, 300);
      }
    };
    
    // Handle visual viewport changes (keyboard open/close)
    const handleViewportChange = () => {
      if (!window.visualViewport) return;
      
      const viewportHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      const keyboardHeight = windowHeight - viewportHeight;
      
      // If keyboard is likely open (height difference > 100px)
      if (keyboardHeight > 100) {
        setIsKeyboardOpen(true);
        
        // Need to adjust message container and scroll position
        requestAnimationFrame(() => {
          scrollToBottom('smooth');
        });
      } else {
        setIsKeyboardOpen(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Use visualViewport API if available (preferred for keyboard detection)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    } else {
      // Fallback for browsers without visualViewport API
      window.addEventListener('resize', handleViewportChange);
    }
    
    // Initial scroll to bottom
    scrollToBottom('auto');
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleViewportChange);
      }
    };
  }, [isMobile, scrollToBottom, isKeyboardOpen]);

  // Improved focus handling for mobile
  const handleInputFocus = () => {
    if (!isMobile) return;
    
    setIsKeyboardOpen(true);
    
    // Give the keyboard time to fully open before adjusting scroll
    setTimeout(() => {
      scrollToBottom('smooth');
      
      // Make sure input remains visible above keyboard
      if (window?.visualViewport && textareaRef.current) {
        const viewportHeight = window.visualViewport.height;
        const inputRect = textareaRef.current.getBoundingClientRect();
        
        // If input is hidden by keyboard, scroll to make it visible
        if (inputRect.bottom > viewportHeight) {
          window.scrollTo({
            top: window.scrollY + (inputRect.bottom - viewportHeight) + 16,
            behavior: 'smooth'
          });
        }
      }
    }, 100);
  };

  // Handle blur - we don't want to lose focus accidentally on mobile
  const handleInputBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (!isMobile) return;
    
    // Get the related target (what was clicked to cause the blur)
    const relatedTarget = e.relatedTarget;
    
    // Allow blur when buttons are clicked (like send button)
    const isSendButton = relatedTarget?.getAttribute('aria-label') === 'Send message';
    const isCameraButton = relatedTarget?.getAttribute('aria-label') === 'Take a photo';
    
    if (isSendButton || isCameraButton) {
      e.preventDefault();
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
      return;
    }
    
    // For other cases, determine if it was intentional
    setTimeout(() => {
      const activeElement = document.activeElement;
      if (activeElement === document.body) {
        textareaRef.current?.focus();
      } else {
        setIsKeyboardOpen(false);
      }
    }, 100);
  };

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
    setShowMediaOptions(true);
  }

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
      setShowMediaOptions(false);
    }
  }

  const handleGallerySelect = () => {
    if (fileInputRef.current) {
      // Remove capture attribute to open gallery
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
      setShowMediaOptions(false);
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected or selection cancelled.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    console.log("Original file selected:", file.name, file.type, file.size);
    
    const options = {
      maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true, initialQuality: 0.7,
    };

    try {
      console.log("Compressing image...");
      const compressedFile = await imageCompression(file, options);
      console.log("Compressed file:", compressedFile.name, compressedFile.type, compressedFile.size);

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          if (event.target?.result) {
            const imageDataUrl = event.target.result.toString();
            const tempId = uuidv4();

            // Ensure focus *before* state updates on mobile
            if (isMobile) textareaRef.current?.focus();
            
            const optimisticImageMessage: Message = {
              id: tempId,
              clientId: tempId,
              sender: role,
              content: imageDataUrl, 
              timestamp: new Date().toISOString(),
              seen: false,
              type: "image" as const,
            };
            setMessages(prev => [...prev, optimisticImageMessage]);
            
            // Send the image (async)
            sendImage(imageDataUrl, tempId);

            // Re-assert focus after potential DOM updates on mobile
            if (isMobile) {
               requestAnimationFrame(() => {
                  textareaRef.current?.focus();
               });
            }

          } else {
            console.error("FileReader error after compression");
          }
        } catch (error) {
           console.error("Error handling compressed file read:", error);
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = ""; 
        }
      };
      reader.onerror = (error) => {
        console.error("Error reading compressed file:", error);
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Image compression failed:", error);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleProfileClick = () => {
    router.push(`/profile/${otherPerson}`)
  }

  const handleSendMessage = () => {
    const contentToSend = newMessage.trim();
    if (contentToSend) {
      const tempId = uuidv4(); 
      const optimisticMessage: Message = { 
        id: tempId, clientId: tempId, sender: role, content: contentToSend,
        timestamp: new Date().toISOString(), seen: false, type: "text" as const,
      };

      // On mobile, prevent keyboard hiding by saving focus state
      let hadFocus = false;
      if (isMobile && textareaRef.current) {
        hadFocus = document.activeElement === textareaRef.current;
      }

      // Update state first
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      setNewMessage(''); 
      
      // Send the message
      sendMessage(contentToSend, tempId);

      // On mobile, ensure we maintain keyboard focus after sending
      if (isMobile && textareaRef.current) {
        // Reset height immediately
        textareaRef.current.style.height = 'auto';
        
        // Use immediate focus restoration to prevent keyboard flashing
        if (hadFocus) {
          // Need to keep focus without allowing the browser to hide the keyboard
          textareaRef.current.focus({preventScroll: true});
          
          // Then scroll after a tiny delay to ensure keyboard remains visible
          requestAnimationFrame(() => {
            scrollToBottom("smooth");
          });
        }
      }
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    // Find the message to delete, preferring clientId if available
    const messageToDelete = messages.find(m => m.clientId === messageId || m.id === messageId);
    if (!messageToDelete || messageToDelete.sender !== role) {
      console.warn("Cannot delete message - not found or not owner", messageId);
      return;
    }
    
    console.log(`Deleting message with final ID: ${messageToDelete.id}`);
    deleteMessage(messageToDelete.id); // Call hook's delete with final ID
  };

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
    setMessages(updatedMessages);
  };
  
  // Handle separator deletion
  const handleDeleteSeparator = (separatorId: string) => {
    const updatedMessages = messages.filter(message => message.id !== separatorId);
    setMessages(updatedMessages);
  };
  
  // Handle separator dragging
  const handleSeparatorDrag = (separatorId: string, clientY: number) => {
    const separatorIndex = messages.findIndex(msg => msg.id === separatorId);
    if (separatorIndex === -1) return;
    
    const separatorElement = document.querySelector(`[data-separator-id="${separatorId}"]`);
    if (!separatorElement) return;
    
    const messageElements = Array.from(document.querySelectorAll('[data-message-id]'));
    let targetIndex = -1;
    
    for (let i = 0; i < messageElements.length; i++) {
      const rect = messageElements[i].getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      
      if (clientY < midpoint) {
        targetIndex = messages.findIndex(msg => msg.id === messageElements[i].getAttribute('data-message-id'));
        break;
      }
    }
    
    if (targetIndex === -1) {
      targetIndex = messages.length - 1;
    }
    
    if (
      targetIndex === separatorIndex || 
      targetIndex === separatorIndex - 1 || 
      (messages[targetIndex]?.type === 'day-separator') || 
      (targetIndex > 0 && messages[targetIndex - 1]?.type === 'day-separator')
    ) {
      return;
    }
    
    const updatedMessages = [...messages];
    const [removedSeparator] = updatedMessages.splice(separatorIndex, 1);
    const insertAt = targetIndex > separatorIndex ? targetIndex - 1 : targetIndex;
    updatedMessages.splice(insertAt, 0, removedSeparator);
    setMessages(updatedMessages);
  };

  // Handle press and hold for separator
  const handleDividerMouseDown = (index: number) => {
    setShowDivider(index);
    dividerTimeoutRef.current = setTimeout(() => {
      setInsertPosition(index);
      setSeparatorDialogOpen(true);
      setShowDivider(null);
    }, 500); // 500ms press and hold
  };

  const handleDividerMouseUp = () => {
    if (dividerTimeoutRef.current) {
      clearTimeout(dividerTimeoutRef.current);
    }
    setShowDivider(null);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (dividerTimeoutRef.current) {
        clearTimeout(dividerTimeoutRef.current);
      }
    };
  }, []);

  // Handle touch start on chat container
  const handleChatContainerTouch = (e: React.TouchEvent) => {
    // If the touch target is the chat container itself (not a message or interactive element)
    if (e.target === chatContainerRef.current) {
      e.preventDefault(); // Prevent keyboard popup
    }
  };

  // Handle mute toggle with animation
  const handleMuteToggle = () => {
    const newMuteState = !isMuted;
    setIsMuting(newMuteState);
    setShowMuteAnimation(true);
    setIsMuted(newMuteState);
    
    // Hide animation after delay
    setTimeout(() => {
      setShowMuteAnimation(false);
    }, 800);
  };

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Add overlay div */}
      <div className={cn(
        "fixed inset-0 bg-black/20 transition-opacity duration-300 z-10 pointer-events-none",
        isMuted ? "opacity-100" : "opacity-0"
      )} />
      <MuteAnimation 
        show={showMuteAnimation} 
        role={role}
        isMuting={isMuting}
      />
      <div className={cn(
        "flex flex-col h-full relative z-20",
        "transition-opacity duration-300",
        isMuted ? "opacity-60" : "opacity-100"
      )}
        onTouchStart={handleChatContainerTouch}
      >
        <header className={cn(
          "flex flex-shrink-0 items-center justify-between border-b shadow-md",
          // Apply safe area inset padding for iOS notch
          "pt-4 pb-4 px-4",
          "pt-[calc(env(safe-area-inset-top)+1rem)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]",
          role === 'akash' 
            ? "border-gray-800 bg-gray-900" 
            : "border-border bg-card",
          "relative z-20" // Ensure header stays above overlay
        )}>
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "mr-2 hover:bg-secondary",  
                "text-white",
                "ml-1"
              )} 
              onClick={() => router.push("/")}
            >
              <ArrowLeft size={26} />
            </Button>
            <div className="flex cursor-pointer items-center" onClick={handleProfileClick}>
              <div className="relative h-11 w-11">
                {otherPerson === "akash" ? (
                  <Image
                    src="/a.jpeg"
                    alt="akash"
                    className="rounded-full object-cover"
                    width={44}
                    height={44}
                  />
                ) : (
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-blue-600 text-white font-bold">DI</AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-semibold capitalize text-white font-bold tracking-wide">{otherPerson}</h2>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <Button 
              variant="ghost"
              size="icon" 
              className={cn(
                "rounded-full p-2 transition-none !duration-0 !bg-transparent relative",
                role === 'akash' 
                  ? "!text-gray-300 hover:!text-gray-300 hover:!bg-transparent active:!bg-transparent"
                  : "!text-foreground/80 hover:!text-foreground/80 hover:!bg-transparent active:!bg-transparent"
              )}
              onClick={handleMuteToggle}
            >
              <Bell 
                size={22} 
                className={cn(
                  "transition-opacity duration-300",
                  isMuted ? "opacity-50" : "opacity-100"
                )} 
              />
              {isMuted && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[1.5px] h-7 bg-red-500 rotate-45 transform origin-center" />
                </div>
              )}
            </Button>
          </div>
        </header>

        <div 
          ref={chatContainerRef} 
          className={cn(
            "relative flex-1 overflow-y-auto p-3 pb-1 sm:p-4",
            "pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]",
            isMobile && isKeyboardOpen ? "pb-4" : "",
            "relative z-20"
          )}
        >
          <ChatBackground role={role} />
          <div className="relative z-10 space-y-0.5 pb-1"> {/* Remove touch-auto since we're handling touch differently */}
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
                <React.Fragment key={message.clientId || message.id}>
                  {/* Render based on message type */}
                  {message.type === 'day-separator' ? (
                    <div data-separator-id={message.id} className="relative z-20">
                      <DaySeparator 
                        text={message.content} 
                        onDelete={() => handleDeleteSeparator(message.id)}
                        onDragEnd={(clientY) => handleSeparatorDrag(message.id, clientY)}
                        userRole={role}
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
                        onDeleteMessage={() => handleDeleteMessage(message.clientId || message.id)} 
                        isLastSeenByOther={index === validLastSeenIndex} 
                        userRole={role}
                      />
                    </div>
                  )}
                  
                  {/* Area between messages for press and hold */}
                  {index < messages.length - 1 && (
                    <div 
                      className={cn(
                        "relative h-0.5 w-full cursor-pointer transition-all duration-200",
                        showDivider === index ? "bg-muted" : "hover:bg-muted/30"
                      )}
                      onMouseDown={() => handleDividerMouseDown(index)}
                      onMouseUp={handleDividerMouseUp}
                      onMouseLeave={handleDividerMouseUp}
                      onTouchStart={() => handleDividerMouseDown(index)}
                      onTouchEnd={handleDividerMouseUp}
                    >
                      {showDivider === index && (
                        <div className="absolute inset-0 flex items-center justify-center -mt-3">
                          <div className={cn(
                            "rounded-full p-1 transition-colors duration-200",
                            role === 'akash' ? "bg-gray-800" : "bg-muted",
                          )}>
                            <Plus size={16} className="text-muted-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ));
            })()}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start animate-pulse mb-2">
                <div className={cn(
                  "ml-2 rounded-full px-4 py-2 shadow-md",
                  role === 'akash' ? "bg-gray-800" : "bg-secondary"
                )}>
                  <div className="flex items-center space-x-1">
                    <div className={cn(
                      "h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.3s]",
                      role === 'akash' ? "bg-blue-400" : "bg-muted-foreground"
                    )}></div>
                    <div className={cn(
                      "h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.15s]",
                      role === 'akash' ? "bg-blue-400" : "bg-muted-foreground"
                    )}></div>
                    <div className={cn(
                      "h-1.5 w-1.5 animate-bounce rounded-full",
                      role === 'akash' ? "bg-blue-400" : "bg-muted-foreground"
                    )}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-0.5" />
          </div>
        </div>

        <div className={cn(
          "flex flex-shrink-0 items-center border-t p-2 sm:p-3",
          "pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]",
          isMobile && isKeyboardOpen ? "pb-2" : "",
          role === 'akash' 
            ? "border-gray-800 bg-gray-900" 
            : "border-border bg-card",
          "relative z-20"
        )}>
          <Button
            className={cn(
              "mr-1 h-12 w-12 flex-shrink-0 rounded-full text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform",
              role === 'akash' ? "bg-blue-600 hover:bg-blue-600" : "bg-primary",
              "ml-2"
            )}
            onClick={handleCameraClick}
            aria-label="Take a photo"
            // Prevent keyboard from hiding on iOS when camera button is clicked
            onMouseDown={(e) => isMobile && e.preventDefault()}
          >
            <Camera size={24} />
          </Button>

          <div className="relative flex-1 mx-1">
            <Textarea
              ref={textareaRef}
              rows={1}
              placeholder="Message..."
              className={cn(
                "w-full border py-2 px-4 text-base text-foreground placeholder:text-muted-foreground resize-none overflow-hidden focus:outline-none focus-visible:outline-none focus:border-input focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:ring-offset-0 min-h-[44px] leading-normal transition-all duration-200",
                role === 'akash' ? "bg-gray-800 border-gray-700" : "bg-input",
                // Add fixed position styles when keyboard is open on iOS
                isMobile && isKeyboardOpen && /iPhone|iPad|iPod/.test(navigator.userAgent) ? "sticky bottom-0" : ""
              )}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                // Emit typing event to server when user types
                if (e.target.value.trim()) {
                  startTyping();
                }
              }}
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
            className={cn(
              "ml-1 h-12 w-12 flex-shrink-0 rounded-full text-primary-foreground active:scale-95 transition-transform",
              role === 'akash' 
                ? "bg-blue-600 hover:bg-blue-600" 
                : "bg-primary hover:bg-primary/90",
              "mr-2"
            )}
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            aria-label="Send message"
            // Prevent keyboard dismissal on mobile
            onMouseDown={(e) => isMobile && e.preventDefault()}
          >
            <SendHorizontal size={24} />
          </Button>
        </div>
      </div>

      {/* Day separator dialog */}
      <DaySeparatorDialog 
        open={separatorDialogOpen}
        onOpenChange={setSeparatorDialogOpen}
        onConfirm={handleAddDaySeparator}
      />
      
      {/* Hidden file input for image selection */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      {viewingImage && <ImageViewer src={viewingImage} onClose={() => setViewingImage(null)} />}

      {/* Image source selection modal */}
      {showMediaOptions && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4">
          <div className={cn(
            "w-full max-w-md rounded-lg p-4 mb-6 animate-in fade-in slide-in-from-bottom-10",
            role === 'akash' ? "bg-gray-900" : "bg-card"
          )}>
            <div className="flex flex-col space-y-3">
              <Button 
                className={cn(
                  "flex items-center justify-start text-base font-normal p-4 h-auto",
                  role === 'akash' ? "bg-gray-800 hover:bg-gray-700 text-white" : ""
                )}
                onClick={handleCameraCapture}
              >
                <Camera className="mr-3" size={22} />
                Take Photo
              </Button>
              <Button 
                className={cn(
                  "flex items-center justify-start text-base font-normal p-4 h-auto",
                  role === 'akash' ? "bg-gray-800 hover:bg-gray-700 text-white" : ""
                )}
                onClick={handleGallerySelect}
              >
                <ImageIcon className="mr-3" size={22} />
                Choose from Gallery
              </Button>
              <Button 
                variant="ghost" 
                className="mt-2"
                onClick={() => setShowMediaOptions(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
