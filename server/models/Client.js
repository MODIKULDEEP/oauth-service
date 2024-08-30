// models/Client.js
const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true },
  clientSecret: { type: String, required: true },
  redirectUris: [String],
  grants: [String],
});

module.exports = mongoose.model("Client", ClientSchema);
