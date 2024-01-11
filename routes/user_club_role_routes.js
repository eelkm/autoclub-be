const express = require("express");
require("dotenv").config();
const clubs = express.Router();
const { executeQuery } = require("../db/db.js");
const { verifyToken } = require("../verifytoken.js");
const jwt = require("jsonwebtoken");

// Gets all the clubs that user is a member of or follows
clubs.get("/get_clubs_roles", verifyToken, async (req, res, next) => {
  try {
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

    const results = await executeQuery(query, [userId]);
    res.json({ success: true, userRolesClubs: results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

clubs.get("/member_of_clubs", verifyToken, async (req, res, next) => {
  try {
    const providedUsername = req.query.username;

    if (!providedUsername) {
      return res.status(400).json({
        success: false,
        error: "Username is required in the query parameters",
      });
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

    const results = await executeQuery(query, [providedUsername]);
    res.json({ success: true, memberOfClubs: results });
  } catch (error) {
    console.error("Error querying database: ", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = clubs;
