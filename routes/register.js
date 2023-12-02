const express = require('express');
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
          // Generate a JWT token for the newly registered user
          const token = jwt.sign({ username: username }, 'your-secret-key', { expiresIn: '1h' });

          res.json({ success: true, token, results });
        }
      });
    }
  });
});

module.exports = register;
