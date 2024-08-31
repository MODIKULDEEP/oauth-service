// routes/protected.js
const express = require("express");
const User = require("../models/User");
const authenticateToken = require("../middleware/authenticate");

const router = express.Router();

// Protected Route
router.get("/resource", authenticateToken, (req, res) => {
  res.json({ message: "This is a protected resource", user: req.user });
});

router.get("/userinfo", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      sub: user._id,
      name: user.username,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});

router.get("/.well-known/openid-configuration", (req, res) => {
  res.json({
    issuer: process.env.ISSUER,
    authorization_endpoint: `${process.env.BASE_URL}/authorize`,
    token_endpoint: `${process.env.BASE_URL}/token`,
    userinfo_endpoint: `${process.env.BASE_URL}/userinfo`,
    jwks_uri: `${process.env.BASE_URL}/.well-known/jwks.json`,
    response_types_supported: ["code", "id_token", "token id_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email"],
  });
});

module.exports = router;
