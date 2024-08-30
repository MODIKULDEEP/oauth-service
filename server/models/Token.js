// models/Token.js
const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  clientId: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  expiresAt: { type: Date },
});

module.exports = mongoose.model("Token", TokenSchema);
