const express = require("express");
require("dotenv").config();
const register = express.Router();
const { executeQuery } = require("../db/db.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

register.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate the username
    const usernameRegex = /^[a-zA-Z0-9_.]*$/;
    const isUsernameValid = usernameRegex.test(username);
    const isUsernameLengthValid = username.length >= 3 && username.length <= 30;

    if (!isUsernameValid || !isUsernameLengthValid) {
      return res.status(400).json({
        success: false,
        error: "Make sure username is between 3 and 30 characters.",
      });
    }

    // Check if the username already exists
    const checkUsernameQuery = "SELECT * FROM User WHERE username = ?";
    const checkResults = await req.db.executeQuery(checkUsernameQuery, [
      username,
    ]);

    if (checkResults.length > 0) {
      // Username already exists
      return res
        .status(400)
        .json({ success: false, error: "Username already exists" });
    }

    // Username doesn't exist, proceed with registration

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const insertQuery = "INSERT INTO User (username, password) VALUES (?, ?)";
    const insertResults = await req.db.executeQuery(insertQuery, [
      username,
      hashedPassword,
    ]);

    // Get the user ID of the newly registered user
    const userId = insertResults.insertId;

    // Generate a JWT token for the newly registered user
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ success: true, token, results: insertResults });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = register;
