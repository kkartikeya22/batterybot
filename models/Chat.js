const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sheetUrl: { type: String, required: true },
  sheetData: { type: Object, required: true },
  sheetName: { type: String },
  createdAt: { type: Date, default: Date.now },
  messages: [{ role: String, content: String }], // optional: to store conversation
});

module.exports = mongoose.model("Chat", chatSchema);
