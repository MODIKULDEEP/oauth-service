// middleware/authenticate.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    console.log("Authorization header missing");
    return res.sendStatus(401); // Unauthorized
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    console.log("Token missing from Authorization header");
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        console.log("Token expired");
        return res.status(403).json({ error: "token expired" }); // Forbidden
      }
      console.log("Token verification failed", err);
      return res.sendStatus(403); // Forbidden
    }
    const currentTime = Date.now(); // Current time in milliseconds
    const expirationTime = user.exp * 1000; // Token expiration time in milliseconds

    const timeLeft = expirationTime - currentTime; // Time left in milliseconds

    // Convert timeLeft to a more readable format (e.g., seconds, minutes)
    const timeLeftInSeconds = Math.floor(timeLeft / 1000);
    const timeLeftInMinutes = Math.floor(timeLeftInSeconds / 60);

    console.log(`Time left until token expires: ${timeLeftInSeconds} seconds`);
    console.log(`Time left until token expires: ${timeLeftInMinutes} minutes`);
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
