// routes/adminRoutes.js
import express from "express";
import {  getAdminStats, getAllProperties, getAllUsers, toggleBlockUser,  } from "../controllers/adminController.js";
import protect, { isAdmin } from "../middlewares/authMiddleware.js";


const router = express.Router();

// 🔐 Only admin can access this
router.get("/stats",protect, isAdmin, getAdminStats);
router.get("/users", protect,isAdmin, getAllUsers); 
router.put("/block/:id",protect,isAdmin,toggleBlockUser );
router.get("/property",protect,isAdmin, getAllProperties);


export default router;
