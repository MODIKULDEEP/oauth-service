// backend/controllers/authController.js
const axios = require("axios");
const tokenService = require("../services/tokenService");
require("dotenv").config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const OAUTH_SERVER_URL = process.env.OAUTH_SERVER_URL;

const handleAuthCallback = async (req, res) => {
  const { code } = req.body;
  // Create the Basic Auth header
  const authHeader = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64"
  );

  try {
    const response = await axios.post(
      OAUTH_SERVER_URL,
      {
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      },
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    tokenService.setTokens(response.data);
    res.status(200).json({ message: "Authentication successful" });
  } catch (error) {
    // console.error("Error exchanging code for tokens:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = { handleAuthCallback };
