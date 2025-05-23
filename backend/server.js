const { Server } = require("socket.io");
const { createServer } = require("http");
const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = [
  'https://chatfilm.vercel.app',
  'https://chatfilm-princesharmas-projects.vercel.app',
  'https://chatfilm-git-main-princesharmas-projects.vercel.app',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow origin if it's in the allowed list or matches the env var
    if (allowedOrigins.includes(origin) || origin === process.env.ALLOWED_ORIGIN) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// Basic health check route
app.get("/", (req, res) => {
  res.send("API and Socket.IO server is running");
});

// Also handle /api route
app.get("/api", (req, res) => {
  res.send("API and Socket.IO server is running");
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions, // Use the same corsOptions here
  path: "/socket.io/" // Make sure path exactly matches what client expects
});

// Copy the rest of your socket-server.js content here
const userSockets = {}; // Map userId (role) to socketId
const messages = {}; // Store messages per room (e.g., 'akash-divyangini')
const deletedMessageIds = new Set(); // Store deleted message IDs to ensure they stay deleted

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
    
    // Filter out deleted messages before sending
    const activeMessages = messages[roomName].filter(msg => !deletedMessageIds.has(msg.id));
    socket.emit('loadMessages', activeMessages);
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
        
        // Only add message if it's not in the deleted list
        if (!deletedMessageIds.has(message.id)) {
            messages[roomName].push(message);
            
            // Send to all in room including sender
            io.to(roomName).emit("newMessage", message);
            console.log(`Message broadcasted to room ${roomName}:`, message);
        }
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

  // Handle message deletion
  socket.on("deleteMessage", ({ messageId }) => {
    const roomName = Array.from(socket.rooms).find(r => r !== socket.id);
    if (roomName && messages[roomName]) {
      const messageIndex = messages[roomName].findIndex(m => m.id === messageId);
      if (messageIndex > -1) {
        // Check if the user is the message sender
        if (messages[roomName][messageIndex].sender === socket.role) {
          // Add the message ID to the deleted set for persistence
          deletedMessageIds.add(messageId);
          
          // Remove the message from the server's storage
          messages[roomName].splice(messageIndex, 1);
          
          // Notify all users in the room about the deletion
          io.to(roomName).emit("messageDeleted", { messageId });
          console.log(`Message ${messageId} deleted by ${socket.role} and all users in room ${roomName} notified`);
        } else {
          console.log(`Unauthorized delete attempt: ${socket.role} tried to delete message sent by ${messages[roomName][messageIndex].sender}`);
        }
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
        
        // Keep track of the room to notify other members
        const otherRole = role === 'akash' ? 'divyangini' : 'akash';
        const roomName = [role, otherRole].sort().join('-');
        
        // Notify other user in the room about disconnection if they're connected
        const otherUserSocketId = userSockets[otherRole];
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit('userOffline', { role });
          console.log(`Notified ${otherRole} that ${role} went offline`);
        }
        break;
      }
    }
  });
});

// Export the server instance for Vercel
module.exports = httpServer;

const PORT = process.env.PORT || 3001;
// Add this for compatibility with Vercel serverless functions
httpServer.listen(PORT, () => {
    console.log(`Socket.IO server listening on port ${PORT}`);
  });

