// middleware.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

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

module.exports = {
  verifyToken,
};
