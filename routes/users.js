// users.js
const express = require('express');
const users = express.Router();
const db = require('../db/db.js');

users.get('/', (req, res, next) => {
  const query = 'SELECT * FROM User';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error querying database: ', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      res.json({ success: true, users: results });
    }
  });
});

module.exports = users;
