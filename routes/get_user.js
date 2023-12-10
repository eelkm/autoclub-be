const express = require('express');
require('dotenv').config();
const users = express.Router();
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



users.get('/', verifyToken, (req, res, next) => {
  const userId = req.userId;
  const username = req.query.username; // Get username from query parameters

  let query;
  let queryParams;

  if (username) {
    // If username is provided, search by username
    query = 'SELECT username, p_image_link, p_banner_link, desc_about, date_created FROM User WHERE username = ?';
    queryParams = [username];
  } else {
    // If no username is provided, search by user ID
    query = 'SELECT username, p_image_link, p_banner_link, desc_about, date_created FROM User WHERE id_user = ?';
    queryParams = [userId];
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error querying database: ', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else if (results.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
    } else {
      res.json({ success: true, user: results[0] });
    }
  });
});



users.get('/get_username', verifyToken, (req, res, next) => {
  const userId = req.userId;

  const query = 'SELECT username, p_image_link FROM User WHERE id_user = ?';

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error querying database: ', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else if (results.length === 0) {
      res.status(404).json({ success: false, error: 'User not found' });
    } else {
      res.json({ success: true, username: results[0].username, p_image_link: results[0].p_image_link });
    }
  });
});




module.exports = users;