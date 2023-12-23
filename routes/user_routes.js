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


// Gets the user data with the given user ID from the JWT token
users.get('/get_user', verifyToken, (req, res, next) => {
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


// Gets the username of the user with the given user ID from the JWT token
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


// Updates the user's description / about section
users.post('/update_desc_about', verifyToken, (req, res) => {
  const userId = req.userId;
  const { desc_about } = req.body;

  const updateQuery = 'UPDATE User SET desc_about = ? WHERE id_user = ?';

  db.query(updateQuery, [desc_about, userId], (err, results) => {
    if (err) {
      console.error('Error querying database: ', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      res.json({ success: true, results });
    }
  });
});

// Updates the user's profile picture
users.post('/update_profile_picture', verifyToken, (req, res) => {
  const userId = req.userId;
  const { p_image_link } = req.body;

  const updateQuery = 'UPDATE User SET p_image_link = ? WHERE id_user = ?';

  db.query(updateQuery, [p_image_link, userId], (err, results) => {
    if (err) {
      console.error('Error querying database: ', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      res.json({ success: true, results });
    }
  });
})

// Updates the user's cover picture
users.post('/update_cover_picture', verifyToken, (req, res) => {
  const userId = req.userId;
  const { p_banner_link } = req.body;

  const updateQuery = 'UPDATE User SET p_banner_link = ? WHERE id_user = ?';

  db.query(updateQuery, [p_banner_link, userId], (err, results) => {
    if (err) {
      console.error('Error querying database: ', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      res.json({ success: true, results });
    }
  });
})

// Gets the user's friends that he is following
users.get('/get_friends', verifyToken, (req, res) => {
  const userId = req.userId;
  const username = req.query.username;

  const query = `
  SELECT fu.username, fu.p_image_link
  FROM User u
  JOIN Friends f ON u.id_user = f.user_id
  JOIN User fu ON f.followed_user_id = fu.id_user
  WHERE u.username = ?;  
  `;

  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Error querying database: ', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    } else {
      res.json({ success: true, friends: results });
    }
  });
});




module.exports = users;