import Property from "../models/Property.js";
import User from "../models/User.js";
import Chat from "../models/message.js";



export const addProperty = async (req, res) => {
  try {
    const viewer = req.user;
    const userId = viewer._id;

    const isActive =
      viewer.subscription?.active &&
      (!viewer.subscription?.nextBillingDate ||
        new Date() < new Date(viewer.subscription.nextBillingDate));

    if (!isActive) {
      return res.status(403).json({
        message: "You need an active subscription to add/sell a property.",
      });
    }

    const { propertyData } = req.body;
    const parsedData = JSON.parse(propertyData);
    const { coordinates, ...restData } = parsedData;

    // ✅ Extract only image URLs from Cloudinary
    const images =
      req.files?.images?.map((file) => file.path) || [];

    // ✅ Extract floorPlan image URL
    const floorPlan =
      req.files?.floorPlan?.[0]?.path || "";

    const newProperty = new Property({
      ...restData,
      coordinates: {
        lat: coordinates?.lat || "",
        lng: coordinates?.lng || "",
      },
      images, // ✅ Array of image URLs
      floorPlan, // ✅ One URL
      ownerId: userId,
    });

    await newProperty.save();

    res.status(200).json({
      message: "Property added successfully",
      property: newProperty,
    });
  } catch (error) {
    console.error("🔥 addProperty error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getAllProperties = async (req, res) => {
  try {
    const { minPrice, maxPrice, bhk, bathrooms } = req.query;

    const filter = {};

    if (minPrice) filter.price = { ...filter.price, $gte: parseInt(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: parseInt(maxPrice) };
    if (bhk) filter.bhk = { $gte: parseInt(bhk) };
    if (bathrooms) filter.bathrooms = { $gte: parseInt(bathrooms) };

    const properties = await Property.find(filter).sort({ createdAt: -1 });

    res.status(200).json(properties);
  } catch (error) {
    console.error("Error fetching properties:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate("ownerId", "name phone profileImage");

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const propertyWithOwner = {
      ...property.toObject(),
      owner: {
        _id: property.ownerId._id, // ✅ needed for receiverId
        name: property.ownerId.name,
        phone: property.ownerId.phone,
        profileImage: property.ownerId.profileImage || "",
      },
    };

    res.status(200).json(propertyWithOwner);
  } catch (error) {
    console.error("Error fetching property:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getPropertiesByOwner = async (req, res) => {
  const { ownerId } = req.params;

  try {
    const properties = await Property.find({ owner: ownerId }).sort({ createdAt: -1 });

    if (!properties || properties.length === 0) {
      return res.status(404).json({ message: "No properties found for this owner." });
    }

    res.status(200).json(properties);
  } catch (err) {
    console.error("Error fetching properties by owner:", err);
    res.status(500).json({ message: "Server error while fetching properties." });
  }
};
//ajay






