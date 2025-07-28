const express = require("express");
const connectDB = require("./db");
const authRoutes = require("./routes/authRoutes");
const cors = require("cors");
require("dotenv").config();

const app = express();
connectDB();

app.use(cors());
app.use(express.json({ limit: "10000mb" })); // <-- Increased payload limit

app.use("/api/auth", authRoutes);

const sheetRoutes = require("./routes/sheet");
app.use("/api/sheet", sheetRoutes);

const chatRoutes = require("./routes/chatRoutes");
app.use("/api/chat", chatRoutes);


const messageRoutes = require("./routes/messages");
app.use("/api/message", messageRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
