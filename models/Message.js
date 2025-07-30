const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  sender: { type: String, required: true },
  text: { type: String },           // ✅ For user messages
  thought: { type: String },        // ✅ Internal reasoning from Gemini
  answer: { type: String },         // ✅ Final visible response from Gemini
  type: { type: String, enum: ["user", "bot"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});



module.exports = mongoose.model("Message", messageSchema);
