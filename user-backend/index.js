// backend/server.js
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authController = require("./controllers/authController");
const apiController = require("./controllers/apiController");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Route for handling authentication callback from SSO
app.post("/api/auth/callback", authController.handleAuthCallback);

// Route for accessing protected data
app.get("/api/protected", apiController.getProtectedData);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
