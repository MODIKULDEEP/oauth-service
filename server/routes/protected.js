// routes/protected.js
const express = require("express");
const User = require("../models/User");
const Token = require("../models/Token");
const Client = require("../models/Client");
const authenticateToken = require("../middleware/authenticate");
const modeCheck = require("../middleware/modeCheck");

const router = express.Router();

// Protected Route
router.get("/resource", authenticateToken, modeCheck, (req, res) => {
  if (req.appMode === "production") {
    res.json({ message: "This is production data", user: req.user });
  } else {
    res.json({ message: "This is test data", user: req.user });
  }
});

router.get("/userinfo", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      sub: user._id,
      name: user.username,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});

router.get("/.well-known/openid-configuration", (req, res) => {
  res.json({
    issuer: process.env.ISSUER,
    authorization_endpoint: `${process.env.BASE_URL}/authorize`,
    token_endpoint: `${process.env.BASE_URL}/token`,
    userinfo_endpoint: `${process.env.BASE_URL}/userinfo`,
    jwks_uri: `${process.env.BASE_URL}/.well-known/jwks.json`,
    response_types_supported: ["code", "id_token", "token id_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email"],
  });
});

router.get("/userdata", authenticateToken, async (req, res) => {
  const { sub, client_id } = req.user;
  let tokenData;

  try {
    if (client_id) {
      tokenData = await Client.find({ clientId: client_id }).select(
        "_id client_name clientId clientSecret mode"
      );
      if (tokenData[0].mode === "test") {
        return res.json({
          message: "This is a test resource",
          tokenData: tokenData,
        });
      } else if (tokenData[0].mode === "production") {
        return res.json({
          message: "This is a production resource",
          tokenData: tokenData,
        });
      }
      return res.json({
        message: "This is a protected resource",
        tokenData: tokenData,
      });
    } else if (sub) {
      tokenData = await Client.find({ userId: sub })
        .select("_id client_name clientId clientSecret mode")
        .populate("userId")
        .select("_id username");
      res.json({
        message: "This is a protected resource",
        tokenData: tokenData,
      });
    } else {
      res.status(500).json({ error: "Error getting user data" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error getting user data" });
  }
});

// Client Registration
router.post("/client/register", authenticateToken, async (req, res) => {
  const {
    client_name,
    redirect_uris,
    post_logout_redirect_uris,
    response_types,
    mode,
  } = req.body;
  const { sub } = req.user;

  try {
    const clientId = `client_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = generateClientSecret(mode);

    const client = new Client({
      userId: sub,
      client_name,
      clientId,
      clientSecret,
      redirectUris: redirect_uris,
      postLogoutRedirectUris: post_logout_redirect_uris,
      responseTypes: response_types,
      grants: ["authorization_code", "refresh_token", "client_credentials"],
      mode,
    });

    await client.save();

    res.status(201).json({ client_id: clientId, client_secret: clientSecret });
  } catch (err) {
    res.status(500).json({ error: "Error registering client" });
  }
});

function generateClientSecret(mode) {
  const prefix = mode === "test" ? "test_" : "prod_";
  return `${prefix}secret_${Math.random().toString(36).substr(2, 9)}`;
}

// Get app details
router.get("/client/:id", authenticateToken, async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      userId: req.user.sub,
    });
    if (!client) {
      return res.status(404).json({ error: "App not found" });
    }
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: "Error fetching app details" });
  }
});

// Update app
router.put("/client/:appId", authenticateToken, async (req, res) => {
  const { appId } = req.params;
  const {
    client_name,
    redirect_uris,
    post_logout_redirect_uris,
    response_types,
    mode,
  } = req.body;

  try {
    const client = await Client.findById(appId);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Check if the mode has changed
    if (client.mode !== mode) {
      // Generate a new client secret
      client.clientSecret = generateClientSecret(mode);

      // Invalidate all tokens for this client
      await Token.deleteMany({ clientId: client.clientId });
    }

    // Update client fields
    client.client_name = client_name;
    client.redirectUris = redirect_uris;
    client.postLogoutRedirectUris = post_logout_redirect_uris;
    client.responseTypes = response_types;
    client.mode = mode;

    await client.save();

    res.json({
      message: "Client updated successfully",
      client_id: client.clientId,
      client_secret: client.clientSecret,
    });
  } catch (err) {
    res.status(500).json({ error: "Error updating client" });
  }
});

module.exports = router;
