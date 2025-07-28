const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  sender: { type: String, required: true }, // e.g., "Gemini" or user's name/email
  text: { type: String },
  type: { type: String, enum: ["user", "bot"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
