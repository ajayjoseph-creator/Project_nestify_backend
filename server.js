import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import messageRoute from './routes/messageRoutes.js'
import connectDB from './config/db.js';
import Message from './models/message.js';
import userRoutes from './routes/userRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import subscriptionRoutes from './routes/subscription.js';
import propertyRoute from './routes/PropertyRoute.js';

dotenv.config();
const app = express();
const httpServer = createServer(app); // Wrap express with httpServer

// ----------------- 🧠 Middleware Setup -----------------
app.use(cors({
  origin: [
    "https://project-nestify.vercel.app",
    "https://project-nestify-git-main-ajay-josephs-projects.vercel.app",
    "https://project-nestify-pu2pwsnak-ajay-josephs-projects.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json());
app.use(morgan('dev'));

// ----------------- 🧠 MongoDB Connection -----------------
connectDB(); // custom function to connect, as you already created

// ----------------- 🧠 API Routes -----------------

app.use('/api/subscription', subscriptionRoutes);
app.use('/api/property', propertyRoute);
app.use("/api/messages", messageRoute);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// ----------------- 🔌 SOCKET.IO SETUP -----------------
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://project-nestify.vercel.app",
      "https://project-nestify-git-main-ajay-josephs-projects.vercel.app",
      "https://project-nestify-pu2pwsnak-ajay-josephs-projects.vercel.app"
    ],
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // User joins property-based room
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`📦 Socket ${socket.id} joined room: ${roomId}`);
  });

  // Handle incoming messages
  socket.on("send_message", async (data) => {
  try {
    const savedMessage = await Message.create(data);

    const roomId = [data.senderId, data.receiverId].sort().join("_"); // ✅ Fixed room logic
    console.log("📤 Broadcasting to room:", roomId);

    io.to(roomId).emit("receive_message", savedMessage); // ✅ Correct room ID
  } catch (err) {
    console.error("❌ Message save error:", err.message);
  }
});

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// ----------------- 🚀 Start Server -----------------
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
 console.log(`🚀 Server Running on port ${PORT}`);
});
