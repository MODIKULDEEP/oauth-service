// models/Client.js
const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema({
  client_name: { type: String, require: true },
  clientId: { type: String, required: true, unique: true },
  clientSecret: { type: String, required: true },
  redirectUris: [String],
  grants: [String],
  userId: { type: mongoose.Schema.Types.ObjectId, require: true, ref: "User" },
  // OIDC specific fields
  postLogoutRedirectUris: [{ type: String }],
  responseTypes: [{ type: String }], // e.g., "code", "id_token"
  mode: { type: String, enum: ['test', 'production'], default: 'test' },
});

module.exports = mongoose.model("Client", ClientSchema);
