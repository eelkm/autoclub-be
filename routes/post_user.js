const express = require('express');
require('dotenv').config();
const post_user = express.Router();
const db = require('../db/db.js');
const jwt = require('jsonwebtoken');

// Middleware to verify the JWT token
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  console.log('token get_user ', token);


  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Failed to authenticate token:', err);
      return res.status(401).json({ success: false, error: 'Failed to authenticate token' });
    }

    console.log('Decoded token:', decoded);

    req.userId = decoded.userId; // Update to match the payload property name
    next();
  });
}

post_user.post('/add_post', verifyToken, (req, res) => {
  const userId = req.userId;
  const { text, post_media_url } = req.body;

  const insertQuery = 'INSERT INTO ProfilePost (user_id, text, post_media_url, likes) VALUES (?, ?, ?, 0)';

  db.query(insertQuery, [userId, text, post_media_url], (err, results) => {
    if (err) {
      console.error('Error querying database: ', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      res.json({ success: true, results });
    }
  });
});

post_user.delete('/delete_profile_post', verifyToken, (req, res) => {
  const userId = req.userId;
  const { id_profile_post } = req.body;

  const deleteQuery = 'DELETE FROM ProfilePost WHERE user_id = ? AND id_profile_post = ?';

  db.query(deleteQuery, [userId, id_profile_post], (err, results) => {
    if (err) {
      console.error('Error querying database: ', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      res.json({ success: true, results });
      console.log(userId, id_profile_post);
    }
  });
});

module.exports = post_user;