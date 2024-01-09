const express = require("express");
require("dotenv").config();
const login = express.Router();
const { executeQuery } = require("../db/db.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

login.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the username exists in the database
    const checkUsernameQuery = "SELECT * FROM User WHERE username = ?";
    const checkResults = await executeQuery(checkUsernameQuery, [username]);

    if (checkResults.length === 0) {
      // Username not found
      return res
        .status(401)
        .json({ success: false, error: "Invalid username or password" });
    }

    // Username exists, compare passwords
    const userId = checkResults[0].id_user;
    const hashedPassword = checkResults[0].password;

    const passwordMatch = await bcrypt.compare(password, hashedPassword);

    if (!passwordMatch) {
      // Passwords don't match
      return res
        .status(401)
        .json({ success: false, error: "Invalid username or password" });
    }

    // Passwords match, generate a JWT token with user ID
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: 50 * 365 * 24 * 60 * 60,
    }); // 50 years :) Will change later
    console.log(userId);
    console.log("token ", token);

    res.json({ success: true, token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = login;
