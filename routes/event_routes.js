const express = require("express");
require("dotenv").config();
const events = express.Router();
const { executeQuery } = require("../db/db.js");
const { verifyToken } = require("../verifytoken.js");
const jwt = require("jsonwebtoken");

// Gets all events
events.get("/get_events", verifyToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    const query = `
      SELECT *
      FROM Event
      WHERE is_public = 1;
    `;

    const results = await req.db.executeQuery(query);
    res.json({ success: true, events: results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = events;
