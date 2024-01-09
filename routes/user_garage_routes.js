const express = require("express");
require("dotenv").config();
const cars = express.Router();
const { executeQuery } = require("../db/db.js");
const jwt = require("jsonwebtoken");

// Middleware to verify the JWT token
function verifyToken(req, res, next) {
  const token = req.headers["authorization"];
  console.log("token get_user ", token);

  if (!token) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("Failed to authenticate token:", err);
      return res
        .status(401)
        .json({ success: false, error: "Failed to authenticate token" });
    }

    console.log("Decoded token:", decoded);

    req.userId = decoded.userId; // Update to match the payload property name
    next();
  });
}

// Gets all the cars of the user and comment counts with the given username
cars.get("/user_cars", verifyToken, async (req, res, next) => {
  try {
    const providedUsername = req.query.username;

    if (!providedUsername) {
      return res.status(400).json({
        success: false,
        error: "Username is required in the query parameters",
      });
    }

    const query = `SELECT
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
      u.username = ?`;

    const results = await executeQuery(query, [providedUsername]);
    res.status(200).json({ success: true, cars: results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Gets the car with the given car ID
cars.get("/get_car", verifyToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    const carId = req.query.car_id;

    const query = `
      SELECT
        Car.*,
        (SELECT COUNT(car_id) FROM Likes WHERE car_id = Car.id_car) AS likes_count,
        (SELECT COUNT(*) FROM Likes WHERE user_id = ? AND car_id = Car.id_car) AS user_like_count
      FROM
        Car
      WHERE
        id_car = ?
    `;

    const results = await executeQuery(query, [userId, carId]);

    if (results.length === 0) {
      res.status(404).json({ success: false, error: "Car not found" });
    } else {
      const carData = results[0];
      const hasLiked = carData.user_like_count > 0;

      res.json({ success: true, car: carData, hasLiked: hasLiked });
    }
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Adds car to the database and returns the car ID
cars.post("/add_car", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { make_model, desc_car, year } = req.body;

    const insertQuery =
      "INSERT INTO Car (user_id, make_model, desc_car, year) VALUES (?, ?, ?, ?)";
    const results = await executeQuery(insertQuery, [
      userId,
      make_model,
      desc_car,
      year,
    ]);

    // Access the last inserted ID using results.insertId
    const insertedId = results.insertId;
    res.json({ success: true, insertedId });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Updates the car
cars.post("/update_car", verifyToken, async (req, res) => {
  try {
    // const userId = req.userId;
    const { make_model, desc_car, year, id_car } = req.body;

    const updateQuery =
      "UPDATE Car SET make_model = ?, desc_car = ?, year = ? WHERE id_car = ?";
    const results = await executeQuery(updateQuery, [
      make_model,
      desc_car,
      year,
      id_car,
    ]);

    res.json({ success: true, results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Deletes the car
cars.post("/delete_car", verifyToken, async (req, res) => {
  try {
    // const userId = req.userId;
    const { id_car } = req.body;

    const deleteQuery = "DELETE FROM Car WHERE id_car = ?";
    const results = await executeQuery(deleteQuery, [id_car]);

    res.json({ success: true, results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Likes the car
cars.post("/like_car", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { car_id } = req.body;

    const insertQuery = "INSERT INTO Likes (user_id, car_id) VALUES (?, ?)";
    const results = await executeQuery(insertQuery, [userId, car_id]);

    res.json({ success: true, results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Gets all car images of the car with the given car ID
cars.get("/car_images", verifyToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    // get car_id from url
    const car_id = req.query.car_id;

    if (!car_id) {
      return res.status(400).json({
        success: false,
        error: "Car ID is required in the query parameters",
      });
    }

    const query = "SELECT * FROM CarImage WHERE car_id = ?";
    const results = await executeQuery(query, [car_id]);

    res.json({ success: true, results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Adds car image to the database
cars.post("/add_car_image", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { car_id, car_image_url } = req.body;

    const insertQuery =
      "INSERT INTO CarImage (car_id, car_image_url) VALUES (?, ?)";
    const results = await executeQuery(insertQuery, [car_id, car_image_url]);

    res.json({ success: true, results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Deletes car image from the database
cars.post("/delete_car_image", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { id_car_image } = req.body;

    const deleteQuery = "DELETE FROM CarImage WHERE id_car_image = ?";
    const results = await executeQuery(deleteQuery, [id_car_image]);

    res.json({ success: true, results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

module.exports = cars;
