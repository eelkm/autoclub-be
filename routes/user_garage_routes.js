const express = require('express');
require('dotenv').config();
const cars = express.Router();
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

// Gets all the cars of the user and comment counts with the given username
cars.get('/user_cars', verifyToken, (req, res, next) => {
  const providedUsername = req.query.username;

  if (!providedUsername) {
    return res.status(400).json({ success: false, error: 'Username is required in the query parameters' });
  }

  const query =
  `SELECT
    c.*,
    ci.car_image_url AS first_photo,
    COALESCE(cmt.comment_count, 0) AS comment_count
  FROM
    Car c
  JOIN User u ON c.user_id = u.id_user
  LEFT JOIN (
    SELECT
        car_id,
        MIN(id_car_image) AS first_photo_id
    FROM
        CarImage
    GROUP BY
        car_id
  ) first_photo_ids ON c.id_car = first_photo_ids.car_id
  LEFT JOIN CarImage ci ON first_photo_ids.first_photo_id = ci.id_car_image
  LEFT JOIN (
    SELECT
        car_id,
        COUNT(*) AS comment_count
    FROM
        Comment
    GROUP BY
        car_id
  ) cmt ON c.id_car = cmt.car_id
  WHERE
    u.username = ?`

  db.query(query, [providedUsername], (err, results) => {
    if (err) {
      console.error('Error querying database: ', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      res.status(200).json({ success: true, cars: results });
    }
  });
})

// Adds car to the database and returns the car ID

cars.post('/add_car', verifyToken, (req, res) => {
  const userId = req.userId;
  const { make_model, desc_car, year } = req.body;

  const insertQuery = 'INSERT INTO Car (user_id, make_model, desc_car, year, likes) VALUES (?, ?, ?, ?, 0)';
  db.query(insertQuery, [userId, make_model, desc_car, year], (err, results) => {
    if (err) {
      console.error('Error querying database: ', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      // Access the last inserted ID using results.insertId
      const insertedId = results.insertId;
      res.json({ success: true, insertedId });
    }
  });
});







module.exports = cars;