const express = require("express");
require("dotenv").config();
const comments = express.Router();
const { executeQuery } = require("../db/db.js");
const { verifyToken } = require("../verifytoken.js");
const jwt = require("jsonwebtoken");

// Gets all comments
comments.get("/", verifyToken, async (req, res, next) => {
  const user_id = req.userId;
  try {
    const { car_id, profile_post_id, club_post_id } = req.query;

    // Determine which parameter is provided and combine the queries
    let query = `
      SELECT
        Comment.*,
        User.username,
        User.p_image_link,
        COUNT(Likes.comment_id) AS likes_count,
        MAX(CASE WHEN Likes.user_id = ? THEN true ELSE false END) AS has_liked
      FROM Comment
      INNER JOIN User ON Comment.user_id = User.id_user
      LEFT JOIN Likes ON Comment.id_comment = Likes.comment_id
    `;

    let queryParams = [user_id];

    if (car_id) {
      query += " WHERE Comment.car_id = ?";
      queryParams.push(car_id);
    } else if (profile_post_id) {
      query += " WHERE Comment.profile_post_id = ?";
      queryParams.push(profile_post_id);
    } else if (club_post_id) {
      query += " WHERE Comment.club_post_id = ?";
      queryParams.push(club_post_id);
    }

    query += "GROUP BY Comment.id_comment, User.username, User.p_image_link";

    // Execute the query
    const results = await executeQuery(query, queryParams);
    res.json({ success: true, comments: results });
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Adds a comment
comments.post("/add_comment", verifyToken, async (req, res, next) => {
  const user_id = req.userId;
  try {
    const { parrent_comment_id, car_id, profile_post_id, club_post_id, text } =
      req.body;

    // Determine which parameter is provided and combine the queries
    let query = `
      INSERT INTO Comment (parrent_comment_id, user_id, car_id, profile_post_id, club_post_id, text)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    let queryParams = [
      parrent_comment_id,
      user_id,
      car_id,
      profile_post_id,
      club_post_id,
      text,
    ];

    // Execute the query
    await executeQuery(query, queryParams);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to add comment:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Like a comment
comments.post("/like_comment", verifyToken, async (req, res, next) => {
  const user_id = req.userId;
  try {
    const { comment_id } = req.body;

    console.log("comment_id", comment_id);

    let query = `
      INSERT INTO Likes (user_id, comment_id)
      VALUES (?, ?)
    `;

    let queryParams = [user_id, comment_id];

    // Execute the query
    await executeQuery(query, queryParams);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to like comment:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = comments;
