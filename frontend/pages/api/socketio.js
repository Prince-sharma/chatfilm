import { Server as SocketIOServer } from "socket.io";

const userSockets = {}; // Map userId (role) to socketId
const messages = {}; // Store messages per room (e.g., 'akash-divyangini')

// Define allowed origins for CORS
const allowedOrigins = [
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  "https://chatfilm.vercel.app",
  process.env.NODE_ENV === "development" ? "http://localhost:3000" : null
].filter(Boolean);

export default function SocketHandler(req, res) {
  // Only allow websocket connections
  if (res.socket.server.io) {
    console.log("Socket.IO server already running");
    res.end();
    return;
  }

  console.log("Setting up Socket.IO server...");
  
  const io = new SocketIOServer(res.socket.server, {
    path: "/api/socketio",
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    },
    addTrailingSlash: false,
  });
  
  res.socket.server.io = io;

  // Socket.IO connection handler
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Store user's role when they join
    socket.on('join', (role) => {
      console.log(`User ${socket.id} joined as ${role}`);
      userSockets[role] = socket.id;
      socket.role = role; // Attach role to socket object

      // Determine room name (consistent order)
      const otherRole = role === 'akash' ? 'divyangini' : 'akash';
      const roomName = [role, otherRole].sort().join('-');
      socket.join(roomName);
      console.log(`User ${socket.id} (${role}) joined room ${roomName}`);

      // Send existing messages for the room
      if (!messages[roomName]) {
          messages[roomName] = [];
      }
      socket.emit('loadMessages', messages[roomName]);
    });

    // Handle new messages
    socket.on("sendMessage", (message) => {
      console.log("Message received:", message);
      const roomName = Array.from(socket.rooms).find(r => r !== socket.id);
      if (roomName) {
          // Add message to history and broadcast
          message.id = Date.now().toString(); // Assign a simple ID
          message.timestamp = new Date().toISOString();
          message.delivered = false; // Mark as not delivered initially
          message.seen = false;
          messages[roomName].push(message);

          // Send to all in room including sender
          io.to(roomName).emit("newMessage", message);
          console.log(`Message broadcasted to room ${roomName}:`, message);
      }
    });

    // Handle typing indicator
    socket.on("typing", ({ to }) => {
      const recipientSocketId = userSockets[to];
      if (recipientSocketId) {
          console.log(`${socket.role} is typing to ${to}`);
          io.to(recipientSocketId).emit("userTyping", { from: socket.role });
      }
    });

    // Handle stop typing indicator
    socket.on("stopTyping", ({ to }) => {
      const recipientSocketId = userSockets[to];
      if (recipientSocketId) {
          console.log(`${socket.role} stopped typing to ${to}`);
          io.to(recipientSocketId).emit("userStoppedTyping", { from: socket.role });
      }
    });

    // Handle message seen
    socket.on("markAsSeen", ({ messageId, recipientRole }) => {
      const roomName = Array.from(socket.rooms).find(r => r !== socket.id);
      if (roomName && messages[roomName]) {
        const messageIndex = messages[roomName].findIndex(m => m.id === messageId);
        if (messageIndex > -1 && !messages[roomName][messageIndex].seen) {
          messages[roomName][messageIndex].seen = true;
          // Notify the sender that the message was seen
          const senderSocketId = userSockets[messages[roomName][messageIndex].sender];
          if(senderSocketId){
              console.log(`Message ${messageId} marked as seen by ${socket.role}. Notifying sender ${messages[roomName][messageIndex].sender}`);
              io.to(senderSocketId).emit("messageSeenUpdate", { messageId: messageId, seenBy: socket.role });
          }
          // Also update the recipient who just marked it as seen
          socket.emit("messageSeenUpdate", { messageId: messageId, seenBy: socket.role });
        }
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      // Remove user from mapping
      for (const role in userSockets) {
        if (userSockets[role] === socket.id) {
          delete userSockets[role];
          console.log(`Removed ${role} from user mapping.`);
          // Notify other user in the room about disconnection
          const roomName = Array.from(socket.rooms).find(r => r !== socket.id);
          if (roomName) {
              socket.to(roomName).emit('userOffline', { role });
          }
          break;
        }
      }
    });
  });

  console.log("Socket.IO server setup complete");
  res.end();
} 