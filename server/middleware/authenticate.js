// middleware/authenticate.js
const jwt = require("jsonwebtoken");
const Token = require("../models/Token"); // Make sure to import the Token model
const Client = require("../models/Client"); // Import the Client model

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const { AuthToken } = req.cookies;

  let token;
  if (authHeader) {
    token = authHeader.split(" ")[1];
  } else if (AuthToken) {
    token = AuthToken;
  } else {
    return res.sendStatus(401); // Unauthorized
  }

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the token exists in the database
    const tokenExists = await Token.findOne({ accessToken: token });
    if (!tokenExists) {
      return res.status(403).json({ error: "Token has been revoked" }); // Forbidden
    }

    if (authHeader) {
      // Check if the client mode matches the token's mode
      const client = await Client.findOne({ clientId: tokenExists.clientId });
      if (!client || client.mode !== tokenExists.mode) {
        await Token.deleteOne({ accessToken: token });
        return res
          .status(403)
          .json({ error: "Token is no longer valid due to mode change" }); // Forbidden
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(403).json({ error: "Token expired" }); // Forbidden
    }
    return res.sendStatus(403); // Forbidden
  }
};

module.exports = authenticateToken;
