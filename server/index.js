// app.js
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const path = require("path");
require("dotenv").config();

// Initialize the app
const app = express();

// Connect to the database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Set EJS as templating engine
app.set("view engine", "ejs");

// Set the directory where EJS templates are stored
app.set("views", path.join(__dirname, "views"));

// Example route rendering an EJS template
app.get("/", (req, res) => {
  res.render("index", { title: "My App" });
});

// Routes
app.use("/auth", authRoutes);
app.use("/api", protectedRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
