import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import {
  getUserById,
  // addProperty,
  // filterAllProperties,
  // getAllProperties,
  // getPropertyById,
  getUserProfile,
  googleLogin,
  login,
  register,
  sendOtpController,
  updateUserProfile,
  verifyOtpController,
} from "../controllers/userController.js";
import protect from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js";
import { checkSubscription } from "../controllers/SubscriptionController.js";
import { createOrder, verifyPayment } from "../controllers/paymentController.js";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/profile", protect,  getUserProfile);
router.put(
  "/profile",
  protect,
  upload.single("profileImage"),
  updateUserProfile
);
router.post("/send-otp", sendOtpController);
router.post("/verify-otp", verifyOtpController);
// router.post(
//   "/add-property",
//   protect,
//   upload.fields([
//     { name: "images", maxCount: 6 },
//     { name: "floorPlan", maxCount: 1 },
//   ]),
//   addProperty
// );

// router.get("/property/:id",protect, getPropertyById);
// router.get("/all-properties", filterAllProperties);
router.post("/create-order", createOrder);
router.post("/verify",protect, verifyPayment);

router.get("/:id", protect, getUserById);


export default router;
