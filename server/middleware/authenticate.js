// middleware/authenticate.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
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

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(403).json({ error: "token expired" }); // Forbidden
      }
      return res.sendStatus(403); // Forbidden
    }

    // const currentTime = Date.now(); // Current time in milliseconds
    // const expirationTime = user.exp * 1000; // Token expiration time in milliseconds

    // const timeLeft = expirationTime - currentTime; // Time left in milliseconds

    // const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    // const hours = Math.floor(
    //   (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    // );
    // const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    // console.log(
    //   `Time left until token expires: ${days} days ${hours} hours ${minutes} minutes`
    // );
    console.log(user);

    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
