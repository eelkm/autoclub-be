const express = require("express");
const aws = require("aws-sdk");
const crypto = require("crypto");
const dotenv = require("dotenv");
const s3url = express.Router();
const jwt = require("jsonwebtoken");
const { verifyToken } = require("../verifytoken.js");

// 1. Fronted requests secure url from Backend
// 2. Backend with credentals requests secure URL from S3 and sends that to Frontend
// 3. Frontend posts image data to S3 bucket using secure URL
// 4. Frontend sends to Backet that upload was succesfull (Puts url in DB)

dotenv.config();

// Configure aws with accessKeyId and secretAccessKey
const s3 = new aws.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: "v4",
});

// Generates an AWS signed URL for retrieving objects
function generateUploadURL() {
  const rawBytes = crypto.randomBytes(16); // Generate 16 random bytes
  const imageName = rawBytes.toString("hex"); // Convert them to hexadecimal format

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageName,
    Expires: 60, // seconds
  };

  const uploadURL = s3.getSignedUrlPromise("putObject", params);
  return uploadURL;
}

s3url.get("/", verifyToken, async (req, res) => {
  try {
    const url = await generateUploadURL();
    res.json({ success: true, url });
  } catch (error) {
    console.error("Error generating S3 URL:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = s3url;
