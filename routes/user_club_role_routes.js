const express = require('express');
require('dotenv').config();
const clubs = express.Router();
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

// Gets all the clubs that user is a member of or follows
clubs.get('/get_clubs_roles', verifyToken, (req, res, next) => {
  const userId = req.userId;

  const query = `
    SELECT c.name, c.small_img_url, r.role_name, x.is_approved
    FROM User u, User_Role_Club x, Club c, Role r
    WHERE
      u.id_user = ? AND
      u.id_user = x.user_id AND
      c.id_club = x.club_id AND
      r.id_role = x.role_id
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error querying database: ', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      res.json({ success: true, userRolesClubs: results });
    }
  });
});


clubs.get('/member_of_clubs', verifyToken, (req, res, next) => {
  const providedUsername = req.query.username;

  if (!providedUsername) {
    return res.status(400).json({ success: false, error: 'Username is required in the query parameters' });
  }

  const query = `
    SELECT c.name, c.small_img_url, r.role_name
    FROM User u, User_Role_Club x, Club c, Role r
    WHERE
      u.username = ? AND
      u.id_user = x.user_id AND
      c.id_club = x.club_id AND
      r.id_role = x.role_id AND
      x.is_approved = 1
  `;

  db.query(query, [providedUsername], (err, results) => {
    if (err) {
      console.error('Error querying database: ', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      res.json({ success: true, memberOfClubs: results });
    }
  });
});


module.exports = clubs;