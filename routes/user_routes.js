const express = require("express");
require("dotenv").config();
const users = express.Router();
const { executeQuery } = require("../db/db.js");
const { verifyToken } = require("../verifytoken.js");
const jwt = require("jsonwebtoken");

// Gets the user data with the given user ID from the JWT token or username from query parameters
users.get("/get_user", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const username = req.query.username;

    const query = `
      SELECT id_user, username, p_image_link, p_banner_link, desc_about, date_created
      FROM User
      WHERE ${username ? "username" : "id_user"} = ?;
    `;

    const results = await executeQuery(query, [username || userId]);

    if (results.length === 0) {
      res.status(404).json({ success: false, error: "User not found" });
    } else {
      res.json({ success: true, user: results[0] });
    }
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Gets the username of the user with the given user ID from the JWT token
users.get("/get_username", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const query = "SELECT username, p_image_link FROM User WHERE id_user = ?";
    const results = await executeQuery(query, [userId]);

    if (results.length === 0) {
      res.status(404).json({ success: false, error: "User not found" });
    } else {
      const { username, p_image_link } = results[0];
      res.json({ success: true, username, p_image_link });
    }
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Updates the user's description / about section
users.post("/update_desc_about", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { desc_about } = req.body;

    const updateQuery = "UPDATE User SET desc_about = ? WHERE id_user = ?";

    const results = await executeQuery(updateQuery, [desc_about, userId]);
    res.json({ success: true, results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Updates the user's profile picture
users.post("/update_profile_picture", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { p_image_link } = req.body;

    const updateQuery = "UPDATE User SET p_image_link = ? WHERE id_user = ?";

    const results = await executeQuery(updateQuery, [p_image_link, userId]);
    res.json({ success: true, results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Updates the user's cover picture
users.post("/update_cover_picture", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { p_banner_link } = req.body;

    const updateQuery = "UPDATE User SET p_banner_link = ? WHERE id_user = ?";

    const results = await executeQuery(updateQuery, [p_banner_link, userId]);
    res.json({ success: true, results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Gets the user's friends that he is following or followers
users.get("/get_friends", verifyToken, async (req, res) => {
  try {
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

    const results = await executeQuery(query, [username]);
    res.json({ success: true, friends: results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Check if the user is following the given user, returns true if following, false if not
users.get("/check_if_friends", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const friendId = req.query.friendId;

    const query =
      "SELECT * FROM Friends WHERE user_id = ? AND followed_user_id = ?;";

    const results = await executeQuery(query, [userId, friendId]);
    res.json({ success: true, isFollowing: results.length > 0 });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Adds the given user to the user's friends
users.post("/add_friend", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const friendId = req.body.friendId;

    const query =
      "INSERT INTO Friends (user_id, followed_user_id) VALUES (?, ?);";

    const results = await executeQuery(query, [userId, friendId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Removes the given user from the user's friends
users.post("/remove_friend", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const friendId = req.body.friendId;

    const query =
      "DELETE FROM Friends WHERE user_id = ? AND followed_user_id = ?;";

    const results = await executeQuery(query, [userId, friendId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get all likes
users.get("/get_stats", verifyToken, async (req, res) => {
  try {
    const userId = req.query.user_id;

    const query = `
      SELECT
        (SELECT COUNT(*) FROM ProfilePost WHERE user_id = ?) AS profile_post_count,
        (SELECT COUNT(*) FROM Car WHERE user_id = ?) AS car_count;
    `;

    const results = await executeQuery(query, [userId, userId]);
    res.json({ success: true, stats: results[0] });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false });
  }
});

// Search users
users.get("/search_users", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const searchQuery = req.query.search_query;

    console.log("search_query", searchQuery);

    const query = `
      SELECT id_user, username, p_image_link
      FROM User
      WHERE username LIKE ?
      LIMIT 10;
    `;

    const results = await executeQuery(query, [`%${searchQuery}%`]);
    res.json({ success: true, users: results });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

module.exports = users;
