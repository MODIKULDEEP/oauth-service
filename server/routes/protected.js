// routes/protected.js
const express = require("express");
const authenticateToken = require("../middleware/authenticate");

const router = express.Router();

// Protected Route
router.get("/resource", authenticateToken, (req, res) => {
  res.json({ message: "This is a protected resource", user: req.user });
});

module.exports = router;
