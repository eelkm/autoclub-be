const express = require("express");
require("dotenv").config();
const events = express.Router();
const db = require("../db/db.js");
const jwt = require("jsonwebtoken");

// Middleware to verify the JWT token
function verifyToken(req, res, next) {
  const token = req.headers["authorization"];
  console.log("token get_user ", token);

  if (!token) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Failed to authenticate token:", err);
      return res
        .status(401)
        .json({ success: false, error: "Failed to authenticate token" });
    }

    console.log("Decoded token:", decoded);

    req.userId = decoded.userId; // Update to match the payload property name
    next();
  });
}

// Gets all events
events.get("/get_events", verifyToken, (req, res, next) => {
  const userId = req.userId;
  const query = `
    SELECT *
    FROM Event
    Where is_public = 1;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error querying database: ", err);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    } else {
      res.json({ success: true, events: results });
    }
  });
});

module.exports = events;
