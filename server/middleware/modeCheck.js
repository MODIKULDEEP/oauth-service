const Client = require('../models/Client');

const modeCheck = async (req, res, next) => {
  const clientId = req.user.client_id;

  try {
    const client = await Client.findOne({ clientId });

    if (!client) {
      return res.status(401).json({ error: "Invalid client" });
    }

    req.appMode = client.mode;
    next();
  } catch (error) {
    res.status(500).json({ error: "Error checking client mode" });
  }
};

module.exports = modeCheck;
