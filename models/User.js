import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: { type: Number, default: "" },
    place: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    isAdmin: { type: Boolean, default: false },
    isBlocked:{type:Boolean ,default:false},

    subscription: {
      active: { type: Boolean, default: false },
      startDate: { type: Date },
      nextBillingDate: { type: Date },
      plan: { type: String, enum: ["monthly", "fiveMonths", "yearly"] },
      price: Number,
      paymentId: String,
      orderId: String,
      signature: String,
    },

    // 💥 ADD THIS FIELD
    properties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
