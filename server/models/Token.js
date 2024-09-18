// models/Token.js
const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  clientId: { type: String },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  expiresAt: { type: Date },
  mode: { type: String, enum: ["test", "production"], required: true },
});

module.exports = mongoose.model("Token", TokenSchema);
