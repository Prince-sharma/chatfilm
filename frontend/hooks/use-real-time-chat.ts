"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { type Message, initialMessages } from "@/lib/chat-data"
import { debounce } from 'lodash'

// Define a type for the server-to-client events if needed (optional but good practice)
// interface ServerToClientEvents {
//   loadMessages: (messages: Message[]) => void;
//   newMessage: (message: Message) => void;
//   userTyping: (data: { from: string }) => void;
//   userStoppedTyping: (data: { from: string }) => void;
//   messageSeenUpdate: (data: { messageId: string; seenBy: string }) => void;
//   userOffline: (data: { role: string }) => void;
// }

// Define a type for the client-to-server events if needed (optional but good practice)
// interface ClientToServerEvents {
//   join: (role: string) => void;
//   sendMessage: (message: Omit<Message, 'id' | 'seen' | 'delivered'>) => void; // Adjust based on what server expects
//   typing: (data: { to: string }) => void;
//   stopTyping: (data: { to: string }) => void;
//   markAsSeen: (data: { messageId: string; recipientRole: string }) => void;
// }

// Use a more specific type for the socket if you defined the event types
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
// const SOCKET_SERVER_URL = "http://localhost:3001";

export function useRealTimeChat(currentUser: string, otherUser: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  // Debounced function to emit stopTyping
  const emitStopTyping = useCallback(debounce(() => {
    if (socketRef.current && isConnected) {
      console.log("Emitting stopTyping")
      socketRef.current.emit("stopTyping", { to: otherUser })
    }
  }, 1500), [otherUser, isConnected])

  // Effect for Socket Connection and Event Listeners
  useEffect(() => {
    // Prevent connection attempt if currentUser is not set (e.g., during initial render)
    if (!currentUser) return

    console.log(`Attempting to connect to Socket.IO server at ${SOCKET_SERVER_URL} as ${currentUser}`)
    // Initialize socket connection
    // Use specific types if defined: socketRef.current = io<ServerToClientEvents, ClientToServerEvents>(SOCKET_SERVER_URL);
    socketRef.current = io(SOCKET_SERVER_URL)

    const socket = socketRef.current

    // --- Event Listeners ---
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id)
      setIsConnected(true)
      socket.emit("join", currentUser) // Join room with current user's role
    })

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason)
      setIsConnected(false)
      setIsTyping(false) // Reset typing status on disconnect
      // Handle potential reconnection logic here if needed
    })

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      setIsConnected(false)
      // Maybe show an error message to the user
    })

    socket.on("loadMessages", (loadedMessages: Message[]) => {
      console.log("Received loaded messages:", loadedMessages)
      setMessages(loadedMessages)
    })

    socket.on("newMessage", (receivedMessage: Message) => {
      console.log("Received new message:", receivedMessage)
      // Play sound if not muted and message is from other user
      if (!isMuted && receivedMessage.sender === otherUser) {
        // Add sound playing logic here if desired
        // const audio = new Audio('/path/to/notification.mp3');
        // audio.play();
      }
      // Only add the message if it doesn't already exist
      setMessages((prevMessages) => {
        const exists = prevMessages.some(msg => msg.id === receivedMessage.id);
        if (exists) return prevMessages;
        return [...prevMessages, receivedMessage];
      })
      // If the incoming message is from the other user, they are no longer typing
      if (receivedMessage.sender === otherUser) {
        setIsTyping(false)
      }
    })

    socket.on("userTyping", (data: { from: string }) => {
      if (data.from === otherUser) {
        console.log(`${otherUser} is typing...`)
        setIsTyping(true)
      }
    })

    socket.on("userStoppedTyping", (data: { from: string }) => {
      if (data.from === otherUser) {
        console.log(`${otherUser} stopped typing.`)
        setIsTyping(false)
      }
    })

    socket.on("messageSeenUpdate", (data: { messageId: string; seenBy: string }) => {
      console.log(`Message ${data.messageId} seen update received.`)
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === data.messageId ? { ...msg, seen: true } : msg
        )
      )
    })

    // Add listener for message deletion confirmation
    socket.on("messageDeleted", (data: { messageId: string }) => {
      console.log(`Message ${data.messageId} deletion confirmed by server.`);
      // Ensure we immediately remove the message from the UI
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== data.messageId));
    });

    // --- Cleanup ---
    return () => {
      console.log("Disconnecting socket...")
      socket.disconnect()
      setIsConnected(false)
      setIsTyping(false)
      socketRef.current = null
    }
  }, [currentUser, otherUser, isMuted]) // Rerun effect if users change or mute status changes (for sound)

  // Effect for emitting typing status
  useEffect(() => {
    if (!socketRef.current || !isConnected) return

    if (newMessage.trim()) {
      console.log("Emitting typing")
      socketRef.current.emit("typing", { to: otherUser })
      emitStopTyping() // Schedule stopTyping emission
    } else {
      // If message becomes empty, cancel any scheduled stopTyping and emit immediately
      emitStopTyping.cancel()
      console.log("Emitting stopTyping immediately (message cleared)")
      socketRef.current.emit("stopTyping", { to: otherUser })
    }

    // Cleanup debounced function on unmount or dependency change
    return () => emitStopTyping.cancel()
  }, [newMessage, otherUser, isConnected, emitStopTyping])

  // Send a text message
  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current || !isConnected) return

    const messagePayload = {
      sender: currentUser,
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: "text" as const, // Ensure type safety
    }

    console.log("Sending message:", messagePayload)
    socketRef.current.emit("sendMessage", messagePayload)
    setNewMessage("") // Clear input after sending
    emitStopTyping.cancel() // Ensure stop typing is cancelled/emitted
    socketRef.current.emit("stopTyping", { to: otherUser })
  }

  // Send an image message
  const sendImage = (imageUrl: string) => {
    if (!imageUrl || !socketRef.current || !isConnected) return

    const messagePayload = {
      sender: currentUser,
      content: imageUrl,
      timestamp: new Date().toISOString(),
      type: "image" as const,
    }

    console.log("Sending image:", messagePayload)
    socketRef.current.emit("sendMessage", messagePayload)
    // Optionally clear something or provide feedback
  }

  // Mark a message as seen
  const markAsSeen = (messageId: string) => {
    // Find the message first to ensure it exists and is not already marked seen by this user
    const message = messages.find(m => m.id === messageId)
    // Only mark if it's from the other user and not already seen
    if (message && message.sender === otherUser && !message.seen && socketRef.current && isConnected) {
      console.log(`Marking message ${messageId} as seen by ${currentUser}`)
      socketRef.current.emit("markAsSeen", { messageId: messageId, recipientRole: currentUser })
      // Optimistic update locally - server will confirm via 'messageSeenUpdate'
      // setMessages((prevMessages) =>
      //   prevMessages.map((msg) =>
      //     msg.id === messageId ? { ...msg, seen: true } : msg
      //   )
      // );
    } else if (message && message.sender === currentUser && message.seen) {
      console.log(`Message ${messageId} already seen (or own message), not emitting markAsSeen.`)
    }
  }

  // Delete a message
  const deleteMessage = (messageId: string) => {
    // Find the message to ensure it exists and belongs to the current user
    const messageToDelete = messages.find(m => m.id === messageId);
    if (!messageToDelete || messageToDelete.sender !== currentUser) {
      console.warn(`Cannot delete message ${messageId}: Not found or not owner.`);
      return;
    }

    if (!socketRef.current || !isConnected) {
      console.error("Cannot delete message: Socket not connected.");
      // Optionally handle offline deletion queueing here
      return;
    }

    console.log(`Attempting to delete message: ${messageId}`);
    
    // Optimistic update (remove locally immediately)
    setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== messageId));
    
    // Send deletion request to server
    socketRef.current.emit("deleteMessage", { messageId: messageId });
  }

  return {
    messages,
    isTyping,
    isMuted,
    setIsMuted,
    newMessage,
    setNewMessage,
    sendMessage,
    sendImage,
    markAsSeen,
    deleteMessage, // Expose the delete function
    isConnected, // Expose connection status to UI if needed
  }
}
