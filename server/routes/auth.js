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
  const {
    grant_type,
    username,
    password,
    refresh_token,
    code,
    redirect_uri,
    scope = "",
  } = req.body;

  try {
    let client_id, client_secret;
    const scopes = scope.split(" ");

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
        expiresIn: "60d",
      });

      const token = new Token({
        userId: user._id,
        clientId: client_id,
        accessToken,
        refreshToken,
        expiresAt: Date.now() + 60 * 24 * 3600 * 1000, // expires in 60 days
      });
      await token.save();

      // Generate ID Token if the "openid" scope is present
      let idToken;
      if (scopes.includes("openid")) {
        idToken = createIdToken(user, client_id);
      }

      return res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        id_token: idToken, // Return the ID token if generated
        token_type: "Bearer",
        expires_in: 30 * 24 * 3600, // 30 days in seconds
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
        {
          expiresIn: process.env.JWT_EXPIRATION,
        }
      );
      const refreshToken = jwt.sign(
        { sub: client.clientId },
        process.env.JWT_SECRET,
        {
          expiresIn: "60d",
        }
      );

      const token = new Token({
        clientId: client.clientId,
        accessToken,
        refreshToken,
        expiresAt: Date.now() + 60 * 24 * 3600 * 1000, // expires in 60 days
        mode: client.mode,
      });
      await token.save();

      // No ID token for client_credentials grant, as it's not a user-based flow
      return res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "Bearer",
        expires_in: 30 * 24 * 3600, // 30 days in seconds
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
        { expiresIn: "60d" }
      );

      const newToken = new Token({
        userId: existingToken.userId,
        clientId: existingToken.clientId,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: Date.now() + 60 * 24 * 3600 * 1000, // expires in 60 days
        mode: existingToken.mode,
      });
      await newToken.save();

      // Generate ID Token if the "openid" scope is present
      let idToken;
      if (scopes.includes("openid")) {
        const user = await User.findById(existingToken.userId);
        idToken = createIdToken(user, existingToken.clientId);
      }

      return res.json({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        id_token: idToken, // Return the ID token if generated
        token_type: "Bearer",
        expires_in: 30 * 24 * 3600, // 30 days in seconds
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
          { expiresIn: "60d" }
        );

        const token = new Token({
          userId: decoded.sub,
          clientId: client_id,
          accessToken,
          refreshToken,
          expiresAt: Date.now() + 60 * 24 * 3600 * 1000, // expires in 60 days
          mode: client.mode,
        });
        await token.save();

        // Generate ID Token if the "openid" scope is present
        let idToken;
        if (scopes.includes("openid")) {
          const user = await User.findById(decoded.sub);
          idToken = createIdToken(user, client_id);
        }

        return res.json({
          access_token: accessToken,
          refresh_token: refreshToken,
          id_token: idToken, // Return the ID token if generated
          token_type: "Bearer",
          expires_in: 30 * 24 * 3600, // 30 days in seconds
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

  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const authorizationCode = jwt.sign(
      { sub: user._id, client_id, scope },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    const redirectUrl = `${redirect_uri}?code=${authorizationCode}&state=${state}`;
    res.status(200).json({ redirectUrl });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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

// User Login thru id and password from portal
router.post("/userLogin", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Please provide username and password" });
  }

  const user = await User.findOne({ username }).select("+password");
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const passwordMatch = await user.comparePassword(password);
  if (!passwordMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION,
  });
  const refreshToken = jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
    expiresIn: "60d",
  });

  const token = new Token({
    userId: user._id,
    accessToken,
    refreshToken,
    expiresAt: Date.now() + 60 * 24 * 3600 * 1000, // expires in 60 days
    mode: "production", // Assuming mode is production for user login
  });
  await token.save();

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  res.status(200).cookie("AuthToken", accessToken, cookieOptions).json({
    success: true,
    user,
    accessToken,
    refreshToken,
  });
});

// User Logout from portal
router.post("/userLogout", async (req, res) => {
  // clear the cookie of the user
  res.cookie("AuthToken", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: "User Logout Successfully" });
});

const createIdToken = (user, clientId = undefined) => {
  const payload = {
    sub: user._id,
    aud: clientId,
    iss: process.env.ISSUER, // Your OIDC issuer URL, e.g., "https://your-domain.com"
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
};

module.exports = router;
