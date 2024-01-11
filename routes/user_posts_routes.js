const express = require("express");
require("dotenv").config();
const post_user = express.Router();
const { executeQuery } = require("../db/db.js");
const { verifyToken } = require("../verifytoken.js");
const jwt = require("jsonwebtoken");

// Gets the posts of the user with comment count with the given username
post_user.get("/user_posts", verifyToken, async (req, res, next) => {
  try {
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

    const results = await executeQuery(query, [
      userId,
      providedUsername,
      endPost,
      startPost,
    ]);
    res.status(200).json({ success: true, posts: results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

post_user.post("/add_post", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { text, post_media_url } = req.body;

    const insertQuery =
      "INSERT INTO ProfilePost (user_id, text, post_media_url) VALUES (?, ?, ?)";

    const results = await executeQuery(insertQuery, [
      userId,
      text,
      post_media_url,
    ]);
    res.json({ success: true, results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

post_user.delete("/delete_profile_post", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { id_profile_post } = req.body;

    const deleteQuery =
      "DELETE FROM ProfilePost WHERE user_id = ? AND id_profile_post = ?";

    const results = await executeQuery(deleteQuery, [userId, id_profile_post]);
    res.json({ success: true, results });
    console.log(userId, id_profile_post);
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Like the post with the given post ID
post_user.post("/like_post", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { id_profile_post } = req.body;

    const insertQuery =
      "INSERT INTO Likes (user_id, profile_post_id) VALUES (?, ?)";

    const results = await executeQuery(insertQuery, [userId, id_profile_post]);
    res.json({ success: true, results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Get post by single post id
post_user.get("/get_post", verifyToken, async (req, res) => {
  try {
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

    const results = await executeQuery(selectQuery, [
      userId,
      id_profile_post,
      id_profile_post,
    ]);
    res.json({ success: true, post: results[0] });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = post_user;
