// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const bodyParser = require("body-parser");
const db = require("./db/db.js");
const app = express();
const port = 6969;

// Middleware for handling CORS and parsing JSON
app.use(cors());
app.use(bodyParser.json());

// Pool connection middleware
app.use(async (req, res, next) => {
  try {
    req.db = db;
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Routes
const user_routes = require("./routes/user_routes");
const user_posts_routes = require("./routes/user_posts_routes.js");
const user_garage_routes = require("./routes/user_garage_routes.js");
const user_club_role_routes = require("./routes/user_club_role_routes.js");

const comments_routes = require("./routes/comments");
const event_routes = require("./routes/event_routes");

const registerRoutes = require("./routes/register");
const loginRoutes = require("./routes/login");

const s3url = require("./routes/get_s3_secure_url");

app.use("/register", registerRoutes);
app.use("/login", loginRoutes);

app.use("/users", user_routes);
app.use("/post_user", user_posts_routes);
app.use("/clubs", user_club_role_routes);
app.use("/cars", user_garage_routes);
app.use("/comments", comments_routes);
app.use("/events", event_routes);

app.use("/s3url", s3url);

// // Static files
// // Serve static files from the 'dist' directory
// app.use(express.static(path.join(__dirname, "dist")));

// // Handle all other routes by serving the 'index.html' file
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "dist/index.html"));
// });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
