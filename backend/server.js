const { Server } = require("socket.io");
const { createServer } = require("http");
const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = [
  'https://chatfilm.vercel.app',
  'https://chatfilm-princesharmas-projects.vercel.app',
  'https://chatfilm-git-main-princesharmas-projects.vercel.app'
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

console.log("Socket.IO server starting on port 3001...");

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
    console.log(`Typing event received from ${socket.role} to ${to}`);
    const recipientSocketId = userSockets[to];
    if (recipientSocketId) {
        console.log(`${socket.role} is typing to ${to}, sending to socket ${recipientSocketId}`);
        io.to(recipientSocketId).emit("userTyping", { from: socket.role });
    } else {
        console.log(`Could not find socket ID for recipient ${to}. Available users:`, Object.keys(userSockets));
    }
  });

  // Handle stop typing indicator
  socket.on("stopTyping", ({ to }) => {
    console.log(`Stop typing event received from ${socket.role} to ${to}`);
    const recipientSocketId = userSockets[to];
    if (recipientSocketId) {
        console.log(`${socket.role} stopped typing to ${to}, sending to socket ${recipientSocketId}`);
        io.to(recipientSocketId).emit("userStoppedTyping", { from: socket.role });
    } else {
        console.log(`Could not find socket ID for recipient ${to}. Available users:`, Object.keys(userSockets));
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
        // Optional: Notify other user in the room about disconnection
        const roomName = Array.from(socket.rooms).find(r => r !== socket.id);
        if (roomName) {
            socket.to(roomName).emit('userOffline', { role });
        }
        break;
      }
    }
  });
});

// Export the server instance for Vercel
module.exports = httpServer;

// Add this for compatibility with Vercel serverless functions
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`Socket.IO server listening on port ${PORT}`);
  });
}
