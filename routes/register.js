const express = require('express');
require('dotenv').config();
const register = express.Router();
const db = require('../db/db.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

register.post('/', (req, res) => {
  const { username, password } = req.body;

  // Check if the username already exists
  const checkUsernameQuery = 'SELECT * FROM User WHERE username = ?';

  db.query(checkUsernameQuery, [username], async (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error querying database: ', checkErr);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else if (checkResults.length > 0) {
      // Username already exists
      res.status(400).json({ success: false, error: 'Username already exists' });
    } else {
      // Username doesn't exist, proceed with registration

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database
      const insertQuery = 'INSERT INTO User (username, password) VALUES (?, ?)';

      db.query(insertQuery, [username, hashedPassword], (err, results) => {
        if (err) {
          console.error('Error querying database: ', err);
          res.status(500).json({ success: false, error: 'Internal Server Error' });
        } else {
          // Get the user ID of the newly registered user
          const userId = results.insertId;

          // Generate a JWT token for the newly registered user
          const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });

          res.json({ success: true, token, results });
        }
      });
    }
  });
});

module.exports = register;
