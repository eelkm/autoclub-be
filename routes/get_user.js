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

  const query = 'SELECT * FROM User WHERE id_user = ?';
  
  db.query(query, [userId], (err, results) => {
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



users.get('/userRolesClubs', verifyToken, (req, res, next) => {
  const userId = req.userId;

  const query = `
    SELECT c.name, c.banner_img_url, r.role_name
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


module.exports = users;