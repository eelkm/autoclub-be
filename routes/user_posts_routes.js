const express = require("express");
require("dotenv").config();
const post_user = express.Router();
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

// Gets the posts of the user with comment count with the given username
post_user.get("/user_posts", verifyToken, (req, res, next) => {
  const userId = req.userId;
  const providedUsername = req.query.username;
  const startPost = parseInt(req.query.startPost) || 0; // Default to 0 if not provided
  const endPost = parseInt(req.query.endPost) || 10; // Default to 10 if not provided

  if (!providedUsername) {
    return res.status(400).json({
      success: false,
      error: "Username is required in the query parameters",
    });
  }

  const query = `
    SELECT
      u.username,
      p.id_profile_post,
      p.date_created,
      p.text,
      p.post_media_url,
      COALESCE(c.comment_count, 0) AS comment_count,
      COALESCE(l.like_count, 0) AS like_count,
      IFNULL(l.has_liked, 0) AS has_liked
    FROM
      User u
    JOIN
      ProfilePost p ON u.id_user = p.user_id
    LEFT JOIN (
      SELECT
        profile_post_id,
        COUNT(*) AS comment_count
      FROM
        Comment
      GROUP BY
        profile_post_id
    ) c ON p.id_profile_post = c.profile_post_id
    LEFT JOIN (
      SELECT
        profile_post_id,
        COUNT(*) AS like_count,
        MAX(user_id = ?) AS has_liked
      FROM
        Likes
      GROUP BY
        profile_post_id
    ) l ON p.id_profile_post = l.profile_post_id
    WHERE
      u.username = ?
    ORDER BY
      p.date_created DESC
    LIMIT ? OFFSET ?
  `;

  db.query(
    query,
    [userId, providedUsername, endPost, startPost],
    (err, results) => {
      if (err) {
        console.error("Error querying database: ", err);
        res
          .status(500)
          .json({ success: false, error: "Internal Server Error" });
      } else {
        res.status(200).json({ success: true, posts: results });
      }
    }
  );
});

post_user.post("/add_post", verifyToken, (req, res) => {
  const userId = req.userId;
  const { text, post_media_url } = req.body;

  const insertQuery =
    "INSERT INTO ProfilePost (user_id, text, post_media_url) VALUES (?, ?, ?)";

  db.query(insertQuery, [userId, text, post_media_url], (err, results) => {
    if (err) {
      console.error("Error querying database: ", err);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    } else {
      res.json({ success: true, results });
    }
  });
});

post_user.delete("/delete_profile_post", verifyToken, (req, res) => {
  const userId = req.userId;
  const { id_profile_post } = req.body;

  const deleteQuery =
    "DELETE FROM ProfilePost WHERE user_id = ? AND id_profile_post = ?";

  db.query(deleteQuery, [userId, id_profile_post], (err, results) => {
    if (err) {
      console.error("Error querying database: ", err);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    } else {
      res.json({ success: true, results });
      console.log(userId, id_profile_post);
    }
  });
});

// Like the post with the given post ID
post_user.post("/like_post", verifyToken, (req, res) => {
  const userId = req.userId;
  const { id_profile_post } = req.body;

  const insertQuery =
    "INSERT INTO Likes (user_id, profile_post_id) VALUES (?, ?)";

  db.query(insertQuery, [userId, id_profile_post], (err, results) => {
    if (err) {
      console.error("Error querying database: ", err);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    } else {
      res.json({ success: true });
    }
  });
});

// Get post by single post id
post_user.get("/get_post", verifyToken, (req, res) => {
  const userId = req.userId;
  const { id_profile_post } = req.query;

  const selectQuery = `
    SELECT
      p.id_profile_post,
      p.date_created,
      p.text,
      p.post_media_url,
      COALESCE(l.like_count, 0) AS like_count,
      IFNULL(l.has_liked, 0) AS has_liked
    FROM
      ProfilePost p
    LEFT JOIN (
      SELECT
        profile_post_id,
        COUNT(*) AS like_count,
        MAX(user_id = ?) AS has_liked
      FROM
        Likes
      WHERE
        profile_post_id = ?
      GROUP BY
        profile_post_id
    ) l ON p.id_profile_post = l.profile_post_id
    WHERE
      p.id_profile_post = ?;

  `;

  db.query(
    selectQuery,
    [userId, id_profile_post, id_profile_post],
    (err, results) => {
      if (err) {
        console.error("Error querying database: ", err);
        res
          .status(500)
          .json({ success: false, error: "Internal Server Error" });
      } else {
        res.json({ success: true, post: results[0] });
      }
    }
  );
});

module.exports = post_user;
