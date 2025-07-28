const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");

// Add this at the end of your router file, before module.exports

const fetchSheetData = require("../utils/fetchSheetData"); // You’ll create this utility next


// ✅ Add this route
router.put("/:chatId/refetch-sheet", async (req, res) => {
  try {
    const chatId = req.params.chatId;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      console.warn("Chat not found for ID:", chatId);
      return res.status(404).json({ message: "Chat not found" });
    }

    const sheetUrl = chat.sheetUrl;
    if (!sheetUrl) {
      console.warn("No sheet URL in chat document");
      return res.status(400).json({ message: "No sheet URL found in chat" });
    }

    const newSheetData = await fetchSheetData(sheetUrl);

    chat.sheetData = newSheetData;
    await chat.save();

    res.status(200).json({
      message: "Sheet data refetched successfully",
      updatedChat: chat,
    });
  } catch (error) {
    console.error("Refetch error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Refetch sheet data for a given chat
// POST /api/chat/refetch/:chatId
router.post("/refetch/:chatId", async (req, res) => {
  try {
    const chatId = req.params.chatId;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const updatedSheetData = await fetchSheetDataFromUrl(chat.sheetUrl);
    if (!updatedSheetData) {
      return res.status(500).json({ error: "Failed to refetch sheet data" });
    }

    chat.sheetData = updatedSheetData;
    chat.updatedAt = new Date();
    await chat.save();

    res.status(200).json({
      message: "Sheet data refetched successfully",
      chat,
    });
  } catch (err) {
    console.error("❌ Error refetching sheet data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Create a new chat or return existing one
router.post("/create", async (req, res) => {
  try {
    const { userId, sheetUrl, sheetData, sheetName } = req.body;

    if (!userId || !sheetUrl || !sheetData) {
      return res.status(400).json({ error: "Missing required fields: userId, sheetUrl, or sheetData" });
    }

    const existingChat = await Chat.findOne({ userId, sheetUrl });

    if (existingChat) {
      return res.status(200).json({
        chatId: existingChat._id,
        message: "Chat already exists for this sheet",
        existing: true,
      });
    }

    const newChat = new Chat({
      userId,
      sheetUrl,
      sheetName: sheetName || "Untitled Sheet",
      sheetData,
      createdAt: new Date(),
    });

    await newChat.save();

    res.status(201).json({
      chatId: newChat._id,
      message: "New chat created successfully",
      existing: false,
    });
  } catch (err) {
    console.error("❌ Error creating chat:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Get all chats for a specific user
// GET /api/chat/user/:userId
router.get("/user/:userId", async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(chats);
  } catch (err) {
    console.error("Error fetching chats for user:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get chat by ID
// GET /api/chat/:chatId
router.get("/:chatId", async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error("Error fetching chat by ID:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Optional: General fetch by userId (via query param)
// GET /api/chat?userId=abc123
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId query parameter" });
    }

    const chats = await Chat.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(chats);
  } catch (err) {
    console.error("Error fetching chats:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
