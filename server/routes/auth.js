// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Client = require("../models/Client");
const Token = require("../models/Token");

const router = express.Router();

// User Registration
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: "User registered" });
  } catch (err) {
    res.status(500).json({ error: "Error registering user" });
  }
});

// Token Endpoint
router.post("/token", async (req, res) => {
  const { grant_type, username, password, refresh_token, code, redirect_uri } =
    req.body;

  try {
    let client_id, client_secret;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Basic ")
    ) {
      // Extract client_id and client_secret from Basic Auth header
      const base64Credentials = req.headers.authorization.split(" ")[1];
      const credentials = Buffer.from(base64Credentials, "base64").toString(
        "ascii"
      );
      [client_id, client_secret] = credentials.split(":");
    }

    if (grant_type === "password") {
      // Password Grant
      const user = await User.findOne({ username });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const accessToken = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION,
      });
      const refreshToken = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      const token = new Token({
        userId: user._id,
        clientId: client_id,
        accessToken,
        refreshToken,
        expiresAt: Date.now() + 3600000,
      });
      await token.save();

      return res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "Bearer",
        expires_in: 3600,
      });
    } else if (grant_type === "client_credentials") {
      // Client Credentials Grant
      const client = await Client.findOne({
        clientId: client_id,
        clientSecret: client_secret,
      });
      if (!client)
        return res.status(401).json({ error: "Invalid client credentials" });

      const accessToken = jwt.sign(
        { sub: client.clientId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );
      const refreshToken = jwt.sign(
        { sub: client.clientId },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );
      const token = new Token({
        clientId: client.clientId,
        accessToken,
        refreshToken,
        expiresAt: Date.now() + 3600000,
      });
      await token.save();

      return res.json({
        access_token: accessToken,
        refresh_token: refreshToken, // Return the refresh token
        token_type: "Bearer",
        expires_in: 3600,
      });
    } else if (grant_type === "refresh_token") {
      // Refresh Token Grant
      const existingToken = await Token.findOne({
        refreshToken: refresh_token,
      });
      if (!existingToken) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      // Invalidate the old refresh token
      await Token.deleteOne({ refreshToken: refresh_token });

      // Generate a new access token and refresh token
      const newAccessToken = jwt.sign(
        { sub: existingToken.userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );
      const newRefreshToken = jwt.sign(
        { sub: existingToken.userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      const newToken = new Token({
        userId: existingToken.userId,
        clientId: existingToken.clientId,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: Date.now() + 3600000,
      });
      await newToken.save();

      return res.json({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        token_type: "Bearer",
        expires_in: 3600,
      });
    } else if (grant_type === "authorization_code") {
      // Authorization Code Grant
      try {
        const decoded = jwt.verify(code, process.env.JWT_SECRET);

        if (decoded.client_id !== client_id) {
          return res.status(401).json({ error: "Invalid authorization code" });
        }

        const client = await Client.findOne({
          clientId: client_id,
          clientSecret: client_secret,
        });
        if (!client || !client.redirectUris.includes(redirect_uri)) {
          return res
            .status(401)
            .json({ error: "Invalid client or redirect URI" });
        }

        const accessToken = jwt.sign(
          { sub: decoded.sub, client_id },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRATION }
        );
        const refreshToken = jwt.sign(
          { sub: decoded.sub },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );

        const token = new Token({
          userId: decoded.sub,
          clientId: client_id,
          accessToken,
          refreshToken,
          expiresAt: Date.now() + 3600000,
        });
        await token.save();

        return res.json({
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: "Bearer",
          expires_in: 3600,
        });
      } catch (err) {
        return res.status(500).json({ error: "Invalid authorization code" });
      }
    } else {
      return res.status(400).json({ error: "Unsupported grant type" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Authorization Request
router.get("/authorize", async (req, res) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (response_type !== "code") {
    return res.status(400).json({ error: "Unsupported response type" });
  }

  const client = await Client.findOne({ clientId: client_id });
  if (!client || !client.redirectUris.includes(redirect_uri)) {
    return res.status(401).json({ error: "Invalid client or redirect URI" });
  }

  // Assuming you have a login page where users can authenticate
  res.render("login", { client_id, redirect_uri, scope, state });
});

// Handle Login (simplified example)
router.post("/login", async (req, res) => {
  const { username, password, client_id, redirect_uri, scope, state } =
    req.body;

  const user = await User.findOne({ username });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const authorizationCode = jwt.sign(
    { sub: user._id, client_id, scope },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
  );

  // Redirect back to the client with the authorization code
  const redirectUrl = `${redirect_uri}?code=${authorizationCode}&state=${state}`;
  res.redirect(redirectUrl);
});

// User Registration
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = new User({ username, password });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error registering user" });
  }
});

// Client Registration
router.post("/client/register", async (req, res) => {
  const { client_name, redirect_uris } = req.body;

  try {
    const clientId = `client_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `secret_${Math.random().toString(36).substr(2, 9)}`;

    const client = new Client({
      clientId,
      clientSecret,
      redirectUris: redirect_uris,
      grants: ["authorization_code", "refresh_token", "client_credentials"],
    });

    await client.save();

    res.status(201).json({ client_id: clientId, client_secret: clientSecret });
  } catch (err) {
    res.status(500).json({ error: "Error registering client" });
  }
});

module.exports = router;
