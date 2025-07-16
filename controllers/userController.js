import User from "../models/User.js";
import { comparePassword, hashPassword } from "../utils/bcrypt.js";
import { generateAccessToken } from "../utils/jwt.js";
import { OAuth2Client } from "google-auth-library";
import { sendOTP } from "../utils/sendMail.js";
import { otpStore } from "../utils/otpStore.js";
import mongoose from "mongoose";

export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password does not match" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    // ✅ Generate token for newly registered user
    const token = generateAccessToken(newUser);

    // ✅ Send back full user data with _id
    return res.status(201).json({
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.log("register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const login = async (req, res) => {
  console.log("user login");

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    console.log("existing User:", user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = generateAccessToken(user);
    console.log("token :", token);
   res.status(200).json({
  token,
  user: {
    _id: user._id, // ✅ add this
    name: user.name,
    email: user.email,
     isAdmin: user.isAdmin,
  },
});
    console.log("Token:", token);
  } catch (error) {
    console.log("Something went wrong:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: "",
        provider: "google",
      });
    }
    const accessToken = generateAccessToken(user);

    res.status(200).json({
      token: accessToken,
      user: { name: user.name, email: user.email,isAdmin: user.isAdmin, },
    });
  } catch (error) {
    console.error("Google login error", error);
    res.status(401).json({ message: "Invalid Google token" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const viewer = req.user;

    // 🔐 Check if user has an active subscription
    const isActive =
      viewer.subscription?.active &&
      (!viewer.subscription?.nextBillingDate ||
        new Date() < new Date(viewer.subscription.nextBillingDate));

    if (!isActive) {
      return res.status(403).json({
        message: "Active subscription required to update your profile",
      });
    }

    // 📦 Find the actual user
    const user = await User.findById(viewer._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✏️ Update basic fields
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.place = req.body.place || user.place;

    // 📷 Handle image upload from Cloudinary
    if (req.file) {
      console.log("📸 Cloudinary file received:", req.file);

      // ⚠️ `req.file.path` works if you're using multer-storage-cloudinary
     user.profileImage = req.file.path || req.file.secure_url; // ✅ or req.file.url if needed
    }

    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("❌ Profile update error:", err); // 👉 See full error in console
    res.status(500).json({ message: "Failed to update profile" });
  }
};


export const sendOtpController = async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);

  console.log("Generated OTP:", otp);

  try {
    await sendOTP(email, otp);
    res.status(200).json({ message: "OTP sent successfully", otp });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const verifyOtpController = (req, res) => {
  const { email, otp } = req.body;
  const stored = otpStore.get(email);

  if (!stored) return res.status(400).json({ message: "No OTP found" });
  if (Date.now() > stored.expires)
    return res.status(400).json({ message: "OTP expired" });

  if (stored.otp.toString() !== otp.toString())
    return res.status(400).json({ message: "Invalid OTP" });
  console.log("Expected OTP:", otp);
  console.log("User entered OTP:", userOtp);

  otpStore.delete(email); // clear OTP after success
  res.status(200).json({ message: "OTP verified" });
};

// export const addProperty = async (req, res) => {
//   try {
//     const viewer = req.user; // Logged-in user (viewer)
//     const userId = viewer._id;

//     // 🔒 Check if viewer has active subscription
//     const isActive =
//       viewer.subscription?.active &&
//       (!viewer.subscription?.nextBillingDate ||
//         new Date() < new Date(viewer.subscription.nextBillingDate));

//     if (!isActive) {
//       return res.status(403).json({
//         message: "You need an active subscription to add/sell a property.",
//       });
//     }

//     const { propertyData } = req.body;
//     const parsedData = JSON.parse(propertyData);
//     const { coordinates, ...restData } = parsedData;

//     const images = req.files?.images?.map((img) => img.path) || [];
//     const floorPlan = req.files?.floorPlan?.[0]?.path || "";

//     const property = {
//       ...restData,
//       coordinates: {
//         lat: coordinates?.lat || "",
//         lng: coordinates?.lng || "",
//       },
//       images,
//       floorPlan,
//     };

//     // 🔍 Get user again to push property (in case of out-of-date `req.user`)
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // ✅ Push and save
//     user.properties.push(property);
//     await user.save();

//     res.status(200).json({ message: "Property added successfully" });
//   } catch (error) {
//     console.error("addProperty error:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// export const getAllProperties = async (req, res) => {
//   try {
//     const users = await User.find({}, { properties: 1, _id: 0 });
//     const allProperties = users.flatMap((user) => user.properties);
//     res.status(200).json(allProperties);
//   } catch (err) {
//     console.error("Error fetching properties:", err);
//     res.status(500).json({ message: "Failed to fetch properties" });
//   }
// };

// export const getPropertyById = async (req, res) => {
//   try {
//     const propertyId = req.params.id;

//     // Search for user who owns this property
//     const user = await User.findOne({ "properties._id": propertyId });

//     if (!user) {
//       return res.status(404).json({ message: "Property not found" });
//     }

//     const property = user.properties.find(
//       (p) => p._id.toString() === propertyId
//     );

//     if (!property) {
//       return res.status(404).json({ message: "Property not found" });
//     }

//     res.json(property);
//   } catch (err) {
//     console.error("Error fetching property:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// Property details fetch route
// export const getPropertyById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const viewer = req.user;

//     if (!viewer) {
//       return res.status(401).json({ message: "Unauthorized access" });
//     }

//     // 🧹 Removed subscription requirement

//     const propertyOwner = await User.findOne({ "properties._id": id });
//     if (!propertyOwner)
//       return res.status(404).json({ message: "Property not found" });

//     const property = propertyOwner.properties.id(id);
//     if (!property)
//       return res.status(404).json({ message: "Property not found" });

//     res.json({
//       ...property.toObject(),
//       owner: {
//         name: propertyOwner.name,
//         phone: propertyOwner.phone,
//         profileImage: propertyOwner.profileImage,
//       },
//     });
//   } catch (err) {
//     console.error("getPropertyById Error:", err);
//     res.status(500).json({ message: "Server Error" });
//   }
// };


export const filterAllProperties = async (req, res) => {
  try {
    const { minPrice, maxPrice, bhk, bathrooms } = req.query;
    const matchQuery = {};

    if (minPrice || maxPrice) {
      matchQuery["price"] = {};
      if (minPrice) matchQuery["price"].$gte = parseInt(minPrice);
      if (maxPrice) matchQuery["price"].$lte = parseInt(maxPrice);
    }

    if (bhk) matchQuery["bhk"] = parseInt(bhk);
    if (bathrooms) matchQuery["bathrooms"] = parseInt(bathrooms);

    const filteredProps = await User.aggregate([
      { $unwind: "$properties" },
      { $replaceRoot: { newRoot: "$properties" } },
      { $match: matchQuery },
    ]);

    res.status(200).json(filteredProps);
  } catch (error) {
    console.error("Filter Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId)
      .select("name email phone place profileImage subscription") // only show safe fields
      .populate("properties"); // if needed

    if (!user) {
      return res.status(404).json({ message: "User not found ❌" });
    }

    res.json(user);
  } catch (error) {
    console.error("🔴 Error fetching user profile:", error);
    res.status(500).json({ message: "Server error 🚨" });
  }
};
