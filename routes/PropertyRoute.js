// routes/propertyRoutes.js
import express from "express";
import { addProperty, getAllProperties, getPropertiesByOwner } from "../controllers/propertyController.js";
import Property from "../models/Property.js";
import protect from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";
import { getPropertyById } from "../controllers/propertyController.js";

const router = express.Router();

router.post(
  "/add-property",
  protect,
  upload.fields([
    { name: "images", maxCount: 6 },
    { name: "floorPlan", maxCount: 1 },
  ]),
  addProperty
);

router.get("/all-properties", getAllProperties);
router.get("/property/:id", protect, getPropertyById);
router.get("/owner/:ownerId", async (req, res) => {
  try {
    const { ownerId } = req.params;

    const properties = await Property.find({ ownerId }); // ✅ Match field name

    res.json(properties);
  } catch (err) {
    console.error("Error fetching properties by owner:", err);
    res.status(500).json({ error: "Server error fetching properties" });
  }
});
router.put("/:id", async (req, res) => {
  try {
    const updated = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});


export default router;