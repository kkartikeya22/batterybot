const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);

// 🔥 Add this route for persistent login
router.get("/profile", authMiddleware, (req, res) => {
  res.json(req.user); // req.user is set by the auth middleware
});

module.exports = router;
