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
        expiresIn: "7d",
      });

      const token = new Token({
        userId: user._id,
        clientId: client_id,
        accessToken,
        refreshToken,
        expiresAt: Date.now() + 3600,
      });
      await token.save();

      // Generate ID Token if the "openid" scope is present
      let idToken;
      if (scopes.includes("openid")) {
        // idToken = createIdToken(user, client_id);
        idToken = createIdToken(user);
      }

      return res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        id_token: idToken, // Return the ID token if generated
        token_type: "Bearer",
        expires_in: 60,
      });
    } else if (grant_type === "client_credentials") {
      // Client Credentials Grant
      const client = await Client.findOne({
        clientId: client_id,
        clientSecret: client_secret,
      });
      if (!client)
        return res.status(401).json({ error: "Invalid client credentials" });
      console.log(client.clientId);

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
          expiresIn: "7d",
        }
      );

      const token = new Token({
        clientId: client.clientId,
        accessToken,
        refreshToken,
        expiresAt: Date.now() + 3600,
      });
      await token.save();

      // No ID token for client_credentials grant, as it's not a user-based flow
      return res.json({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "Bearer",
        expires_in: 60,
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
        expiresAt: Date.now() + 3600,
      });
      await newToken.save();

      // Generate ID Token if the "openid" scope is present
      let idToken;
      if (scopes.includes("openid")) {
        const user = await User.findById(existingToken.userId);
        // idToken = createIdToken(user, existingToken.clientId);
        idToken = createIdToken(user);
      }

      return res.json({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        id_token: idToken, // Return the ID token if generated
        token_type: "Bearer",
        expires_in: 60,
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
          expiresAt: Date.now() + 3600,
        });
        await token.save();

        // Generate ID Token if the "openid" scope is present
        let idToken;
        if (scopes.includes("openid")) {
          const user = await User.findById(decoded.sub);
          // idToken = createIdToken(user, client_id);
          idToken = createIdToken(user);
        }

        return res.json({
          access_token: accessToken,
          refresh_token: refreshToken,
          id_token: idToken, // Return the ID token if generated
          token_type: "Bearer",
          expires_in: 60,
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
  const {
    client_name,
    redirect_uris,
    post_logout_redirect_uris,
    response_types,
  } = req.body;

  try {
    const clientId = `client_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `secret_${Math.random().toString(36).substr(2, 9)}`;

    const client = new Client({
      clientId,
      clientSecret,
      redirectUris: redirect_uris,
      postLogoutRedirectUris: post_logout_redirect_uris,
      responseTypes: response_types,
      grants: ["authorization_code", "refresh_token", "client_credentials"],
    });

    await client.save();

    res.status(201).json({ client_id: clientId, client_secret: clientSecret });
  } catch (err) {
    res.status(500).json({ error: "Error registering client" });
  }
});

// User Login thru id and password from portal
router.post("/userLogin", async (req, res) => {
  // Retrieve username and password from request body
  const { username, password } = req.body;

  // Validate username and password
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Please provide username and password" });
  }
  // Find the user with the provided username and populate the role
  const user = await User.findOne({ username }).select("+password");
  // Check if user with the provided username exists
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  let FetchedUser = user;

  // Compare the provided password with the hashed password using the schema method
  const passwordMatch = await user.comparePassword(password);
  if (!passwordMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const cookieOptions = {
    expires: new Date(Date.now() + 60000),
    httpOnly: true,
  };

  const AuthToken = createIdToken(FetchedUser);
  res.status(200).cookie("AuthToken", AuthToken, cookieOptions).json({
    success: true,
    user: FetchedUser,
    accessToken: AuthToken,
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

// const createIdToken = (user, clientId) => {
const createIdToken = (user) => {
  const payload = {
    sub: user._id,
    // aud: clientId,
    iss: process.env.ISSUER, // Your OIDC issuer URL, e.g., "https://your-domain.com"
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + parseInt("60"),
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
};

module.exports = router;
