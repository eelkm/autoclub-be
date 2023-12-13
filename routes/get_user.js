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


// Gets the posts of the user with the given username
users.get('/user_posts', verifyToken, (req, res, next) => {
  const providedUsername = req.query.username;
  const startPost = parseInt(req.query.startPost) || 0; // Default to 0 if not provided
  const endPost = parseInt(req.query.endPost) || 10; // Default to 10 if not provided

  if (!providedUsername) {
    return res.status(400).json({ success: false, error: 'Username is required in the query parameters' });
  }

  const query = `
  SELECT u.username, p.id_profile_post, p.date_created, p.text, p.post_media_url, p.likes,
  COALESCE(c.comment_count, 0) AS comment_count
  FROM User u
  JOIN ProfilePost p ON u.id_user = p.user_id
  LEFT JOIN (
    SELECT profile_post_id, COUNT(*) AS comment_count
    FROM Comment
    GROUP BY profile_post_id
  ) c ON p.id_profile_post = c.profile_post_id
  WHERE u.username = ?
  ORDER BY p.date_created DESC
  LIMIT ? OFFSET ?
  `;

  db.query(query, [providedUsername, endPost, startPost], (err, results) => {
    if (err) {
      console.error('Error querying database: ', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      res.status(200).json({ success: true, posts: results });
    }
  });
});

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




module.exports = users;