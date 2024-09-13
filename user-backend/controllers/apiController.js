// backend/controllers/apiController.js
const axios = require("axios");
const tokenService = require("../services/tokenService");

const EXTERNAL_API_URL = "http://localhost:8010/api/userdata";

const getProtectedData = async (req, res) => {
  if (tokenService.isTokenExpired()) {
    try {
      await tokenService.refreshAccessToken();
    } catch (error) {
      return res.status(401).send("Unauthorized");
    }
  }

  const { accessToken } = tokenService.getTokens();

  try {
    const response = await axios.get(EXTERNAL_API_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error making API request:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = { getProtectedData };
