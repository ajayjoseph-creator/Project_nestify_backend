import express from "express";
import {
  getConversations,
  getRoomMessages,
  sendMessage,
} from "../controllers/messageController.js";
import protect from "../middlewares/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// 🥇 Specific routes on top
router.get("/conversations/:userId", protect, getConversations);
router.get("/by-username/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select(
      "name profileImage"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error("❌ User fetch error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// 🥈 Get messages by roomId
router.get("/:roomId", protect, getRoomMessages);

// 🥉 Send message
router.post("/send", protect, sendMessage);

// 🧨 Generic fallback: Get user by ID
// router.get("/:id", async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).select("name profileImage");
//     if (!user) return res.status(404).json({ error: "User not found" });

//     res.status(200).json(user);
//   } catch (err) {
//     console.error("❌ User fetch error:", err.message);
//     res.status(500).json({ error: "Server error" });
//   }
// });

export default router;
