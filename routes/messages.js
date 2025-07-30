const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const { generateGeminiResponse } = require("../utils/geminiClient");

// Create message and get response from Gemini
router.post("/:chatid", async (req, res) => {
  const { chatId, sender, text, sheetData } = req.body;

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

    // Format message history
    const formattedHistory = recentMessages
      .reverse()
      .map((msg) => {
        if (msg.type === "user") {
          return { role: "user", content: msg.text };
        } else {
          return { role: "model", content: msg.answer || "" };
        }
      });

    // Format sheet data
    let sheetDataString = "undefined";
    if (sheetData && typeof sheetData === "object") {
      try {
        sheetDataString = JSON.stringify(sheetData, null, 2);
      } catch (err) {
        console.warn("⚠️ Failed to stringify sheetData:", err.message);
      }
    }

    // Add current message with context
    formattedHistory.push({
      role: "user",
      content: `${text}\n\nHere is some related data:\n${sheetDataString}`,
    });

    // === Call Gemini ===
    console.log("📤 Sending to Gemini:", formattedHistory);
    const { raw } = await generateGeminiResponse(formattedHistory);
    console.log("📥 Raw Gemini Response:", JSON.stringify(raw, null, 2));

    // === Extract Thought & Answer ===
    const parts = raw?.candidates?.[0]?.content?.parts || [];

    let thought = "";
    let answer = "";

    for (const part of parts) {
      if (part.thought) {
        thought += part.text?.trim() + "\n\n";
      } else {
        answer += part.text?.trim() + "\n\n";
      }
    }

    thought = thought.trim();
    answer = answer.trim();

    console.log("💭 Thought:", thought);
    console.log("💬 Answer:", answer);

    // Save bot message
    const botMessage = new Message({
      chatId,
      sender: "assistant",
      type: "bot",
      thought,
      answer,
    });
    await botMessage.save();

    // Final response
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
