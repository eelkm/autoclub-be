const express = require('express');
const login = express.Router();
const db = require('../db/db.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

login.post('/', (req, res) => {
  const { username, password } = req.body;

  // Check if the username exists in the database
  const checkUsernameQuery = 'SELECT * FROM User WHERE username = ?';

  db.query(checkUsernameQuery, [username], async (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error querying database: ', checkErr);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else if (checkResults.length === 0) {
      // Username not found
      res.status(401).json({ success: false, error: 'Invalid username or password' });
    } else {
      // Username exists, compare passwords
      const hashedPassword = checkResults[0].password;

      const passwordMatch = await bcrypt.compare(password, hashedPassword);

      if (!passwordMatch) {
        // Passwords don't match
        res.status(401).json({ success: false, error: 'Invalid username or password' });
      } else {
        // Passwords match, generate a JWT token
        const token = jwt.sign({ username: username }, 'your-secret-key', { expiresIn: '1h' });

        res.json({ success: true, token });
      }
    }
  });
});

module.exports = login;
