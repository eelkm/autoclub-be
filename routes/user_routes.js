const express = require("express");
require("dotenv").config();
const users = express.Router();
const db = require("../db/db.js");
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

// Gets the user data with the given user ID from the JWT token or username from query parameters
users.get("/get_user", verifyToken, (req, res, next) => {
  const userId = req.userId;
  const username = req.query.username; // Get username from query parameters

  let query;
  let queryParams;

  if (username) {
    // If username is provided, search by username
    query =
      "SELECT id_user, username, p_image_link, p_banner_link, desc_about, date_created FROM User WHERE username = ?";
    queryParams = [username];
  } else {
    // If no username is provided, search by user ID
    query =
      "SELECT id_user, username, p_image_link, p_banner_link, desc_about, date_created FROM User WHERE id_user = ?";
    queryParams = [userId];
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error querying database: ", err);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    } else if (results.length === 0) {
      res.status(404).json({ success: false, error: "User not found" });
    } else {
      res.json({ success: true, user: results[0] });
    }
  });
});

// Gets the username of the user with the given user ID from the JWT token
users.get("/get_username", verifyToken, (req, res, next) => {
  const userId = req.userId;

  const query = "SELECT username, p_image_link FROM User WHERE id_user = ?";

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error querying database: ", err);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    } else if (results.length === 0) {
      res.status(404).json({ success: false, error: "User not found" });
    } else {
      res.json({
        success: true,
        username: results[0].username,
        p_image_link: results[0].p_image_link,
      });
    }
  });
});

// Updates the user's description / about section
users.post("/update_desc_about", verifyToken, (req, res) => {
  const userId = req.userId;
  const { desc_about } = req.body;

  const updateQuery = "UPDATE User SET desc_about = ? WHERE id_user = ?";

  db.query(updateQuery, [desc_about, userId], (err, results) => {
    if (err) {
      console.error("Error querying database: ", err);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    } else {
      res.json({ success: true, results });
    }
  });
});

// Updates the user's profile picture
users.post("/update_profile_picture", verifyToken, (req, res) => {
  const userId = req.userId;
  const { p_image_link } = req.body;

  const updateQuery = "UPDATE User SET p_image_link = ? WHERE id_user = ?";

  db.query(updateQuery, [p_image_link, userId], (err, results) => {
    if (err) {
      console.error("Error querying database: ", err);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    } else {
      res.json({ success: true, results });
    }
  });
});

// Updates the user's cover picture
users.post("/update_cover_picture", verifyToken, (req, res) => {
  const userId = req.userId;
  const { p_banner_link } = req.body;

  const updateQuery = "UPDATE User SET p_banner_link = ? WHERE id_user = ?";

  db.query(updateQuery, [p_banner_link, userId], (err, results) => {
    if (err) {
      console.error("Error querying database: ", err);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    } else {
      res.json({ success: true, results });
    }
  });
});

// Gets the user's friends that he is following
users.get("/get_friends", verifyToken, (req, res) => {
  const userId = req.userId;
  const username = req.query.username;
  const type = req.query.type;

  let query;

  if (type === "following") {
    query = `
    SELECT fu.username, fu.p_image_link
    FROM User u
    JOIN Friends f ON u.id_user = f.user_id
    JOIN User fu ON f.followed_user_id = fu.id_user
    WHERE u.username = ?;  
    `;
  } else if (type === "followers") {
    query = `
    SELECT fu.username, fu.p_image_link
    FROM User u
    JOIN Friends f ON u.id_user = f.followed_user_id
    JOIN User fu ON f.user_id = fu.id_user
    WHERE u.username = ?;
    `;
  } else {
    res.status(400).json({ success: false, error: "Invalid type" });
    return;
  }

  // const query = `
  // SELECT fu.username, fu.p_image_link
  // FROM User u
  // JOIN Friends f ON u.id_user = f.user_id
  // JOIN User fu ON f.followed_user_id = fu.id_user
  // WHERE u.username = ?;
  // `;

  db.query(query, [username], (err, results) => {
    if (err) {
      console.error("Error querying database: ", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    } else {
      res.json({ success: true, friends: results });
    }
  });
});

// Check if the user is following the given user, returns true if following, false if not
users.get("/check_if_friends", verifyToken, (req, res) => {
  const userId = req.userId;
  const friendId = req.query.friendId;

  const query = `
  SELECT * FROM Friends WHERE user_id = ? AND followed_user_id = ?;
  `;

  db.query(query, [userId, friendId], (err, results) => {
    if (err) {
      console.error("Error querying database: ", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    } else {
      res.json({ success: true, isFollowing: results.length > 0 });
    }
  });
});

// Adds the given user to the user's friends
users.post("/add_friend", verifyToken, (req, res) => {
  const userId = req.userId;
  const friendId = req.body.friendId;

  const query = `
  INSERT INTO Friends (user_id, followed_user_id) VALUES (?, ?);
  `;

  db.query(query, [userId, friendId], (err, results) => {
    if (err) {
      console.error("Error querying database: ", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    } else {
      res.json({ success: true });
    }
  });
});

// Removes the given user from the user's friends
users.post("/remove_friend", verifyToken, (req, res) => {
  const userId = req.userId;
  const friendId = req.body.friendId;

  const query = `
  DELETE FROM Friends WHERE user_id = ? AND followed_user_id = ?;
  `;

  db.query(query, [userId, friendId], (err, results) => {
    if (err) {
      console.error("Error querying database: ", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    } else {
      res.json({ success: true });
    }
  });
});

// Get all likes
users.get("/get_stats", verifyToken, (req, res) => {
  const userId = req.query.user_id;

  const query = `
  SELECT
    (SELECT COUNT(*) FROM ProfilePost WHERE user_id = ?) AS profile_post_count,
    (SELECT COUNT(*) FROM Car WHERE user_id = ?) AS car_count;

  `;

  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error("Error querying database: ", err);
      res.status(500).json({ success: false });
    } else {
      res.json({ success: true, stats: results[0] });
    }
  });
});

// Search users
users.get("/search_users", verifyToken, (req, res) => {
  const userId = req.userId;
  const searchQuery = req.query.search_query;

  console.log("search_query", searchQuery);

  const query = `
  SELECT id_user, username, p_image_link
  FROM User
  WHERE username LIKE ?
  LIMIT 10;
  `;

  db.query(query, [`%${searchQuery}%`], (err, results) => {
    if (err) {
      res.status(500).json({ success: false });
    } else {
      res.json({ success: true, users: results });
    }
  });
});

module.exports = users;
