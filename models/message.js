import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: String,
  receiverId: String,
  propertyId: String,
  text: String,
  time: String,
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);
