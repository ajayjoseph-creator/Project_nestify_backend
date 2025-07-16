import Message from "../models/message.js";
import User from "../models/User.js";
import mongoose from "mongoose";

// 🔧 Utility to generate consistent room ID
const getRoomId = (id1, id2) => [id1, id2].sort().join("_");

// 💌 Save a new message (used in socket or REST)
export const sendMessage = async (req, res) => {
  const { senderId, receiverId, text, time } = req.body;

  try {
    const roomId = getRoomId(senderId, receiverId);

    const newMessage = await Message.create({
      senderId,
      receiverId,
      propertyId: roomId, // ✅ Set as room ID
      text,
      time,
    });

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("❌ Message save error:", err.message);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// 📬 Fetch all conversations for a user (used in inbox list)
// export const getConversations = async (req, res) => {
//   const userId = req.params.userId;

//   try {
//     const messages = await Message.find({
//       $or: [{ senderId: userId }, { receiverId: userId }],
//     }).sort({ createdAt: -1 });

//     const convosMap = new Map();

//     for (const msg of messages) {
//       const otherUserId = msg.senderId.toString() === userId ? msg.receiverId : msg.senderId;

//       if (!convosMap.has(otherUserId.toString())) {
//         const otherUser = await User.findById(otherUserId).select("name profileImage");

//         convosMap.set(otherUserId.toString(), {
//           _id: otherUserId,
//           name: otherUser?.name || "Unknown",
//           profileImage: otherUser?.profileImage || null,
//           lastMessage: msg.text,
//           updatedAt: msg.createdAt,
//         });
//       }
//     }

//     const conversations = Array.from(convosMap.values());
//     res.status(200).json(conversations);
//   } catch (err) {
//     console.error("❌ Error in getConversations:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };
export const getConversations = async (req, res) => {
  const userId = req.params.userId;

  // 🛡️ Validate userId first
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid or missing user ID" });
  }

  try {
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 });

    const convosMap = new Map();

    for (const msg of messages) {
      const otherUserId = msg.senderId.toString() === userId
        ? msg.receiverId
        : msg.senderId;

      const otherUserIdStr = otherUserId.toString();

      if (!convosMap.has(otherUserIdStr)) {
        // 🛡️ Only query if ID is valid
        if (!mongoose.Types.ObjectId.isValid(otherUserIdStr)) continue;

        const otherUser = await User.findById(otherUserIdStr).select("name profileImage");

        convosMap.set(otherUserIdStr, {
          _id: otherUserIdStr,
          name: otherUser?.name || "Unknown",
          profileImage: otherUser?.profileImage || null,
          lastMessage: msg.text,
          updatedAt: msg.createdAt,
        });
      }
    }

    const conversations = Array.from(convosMap.values());
    res.status(200).json(conversations);
  } catch (err) {
    console.error("❌ Error in getConversations:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 📜 Fetch all messages in a room
export const getRoomMessages = async (req, res) => {
  try {
    const roomId = req.params.roomId;

    const messages = await Message.find({ propertyId: roomId }).sort("createdAt");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
