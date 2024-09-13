// backend/services/tokenService.js
const axios = require("axios");
require("dotenv").config();

const tokenStorage = {
  accessToken: null,
  refreshToken: null,
  tokenExpiry: null,
};

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const OAUTH_SERVER_URL = process.env.OAUTH_SERVER_URL;

const setTokens = (tokens) => {
  tokenStorage.accessToken = tokens.access_token;
  tokenStorage.refreshToken = tokens.refresh_token;
  tokenStorage.tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
};

const getTokens = () => ({
  accessToken: tokenStorage.accessToken,
  refreshToken: tokenStorage.refreshToken,
});

const isTokenExpired = () =>
  !tokenStorage.accessToken || new Date() >= tokenStorage.tokenExpiry;

const refreshAccessToken = async () => {
  if (!tokenStorage.refreshToken) throw new Error("No refresh token available");

  try {
    const response = await axios.post(OAUTH_SERVER_URL, {
      grant_type: "refresh_token",
      refresh_token: tokenStorage.refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    setTokens(response.data);
    return response.data.access_token;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw new Error("Unable to refresh access token");
  }
};

module.exports = {
  setTokens,
  getTokens,
  isTokenExpired,
  refreshAccessToken,
};
