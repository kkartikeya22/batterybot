const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const { generateGeminiResponse } = require("../utils/geminiClient");

// Create message and get response from Gemini
router.post("/:chatid", async (req, res) => {
  const { chatId, sender, text } = req.body;
  const sheetData = req.body.sheetData;


  try {
    // Save user message
    const userMessage = new Message({
      chatId,
      sender,
      text,
      type: "user",
    });
    await userMessage.save();

    // Fetch recent messages
    const recentMessages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const formattedHistory = recentMessages
      .reverse()
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        content: msg.text,
      }));

    // Add current user message
    formattedHistory.push({ role: "user", content: text });

    // Attach sheetData to final prompt if present
    let sheetDataString = "undefined";
    if (sheetData && typeof sheetData === "object") {
      try {
        sheetDataString = JSON.stringify(sheetData, null, 2);
      } catch (err) {
        console.warn("⚠️ Failed to stringify sheetData:", err.message);
      }
    } else {
      console.warn("⚠️ sheetData is missing or invalid");
    }

    formattedHistory.push({
      role: "user",
      content: `${text}\n\nHere is some related data:\n${sheetDataString}`,
    });


    const geminiReply = await generateGeminiResponse(formattedHistory);

    const botMessage = new Message({
      chatId,
      sender: "assistant",
      text: geminiReply,
      type: "bot",
    });
    await botMessage.save();

    res.status(200).json([userMessage, botMessage]);
  } catch (error) {
    console.error("❌ Message handling failed:", error.message);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get all messages
router.get("/:chatId", async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId }).sort({
      createdAt: 1,
    });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

module.exports = router;
