import mongoose from "mongoose";


const propertySchema = new mongoose.Schema(
  {
    place: { type: String },
    price: { type: Number },
    size: { type: Number },
    type: { type: String, default: "Home for Rent" },
    propertyId: { type: String },
    year: { type: String },
    phone: { type: Number },
    floorPlan: { type: String },
    floorPlanPreview: { type: String },
    description: { type: String },
    bhk: { type: Number },
    bathrooms: { type: Number },
    parking: { type: Number },
    coordinates: {
      lat: { type: String },
      lng: { type: String },
    },
    images: [String],

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔥 New Field for Status
    status: {
      type: String,
      enum: ["available", "booked", "confirmed", "sold"],
      default: "available",
    },
  },
  {
    timestamps: true,
  }
);

const Property = mongoose.model("Property", propertySchema);
export default Property;
