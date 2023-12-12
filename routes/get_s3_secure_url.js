const express = require('express');
const aws = require('aws-sdk');
const crypto = require('crypto');
const dotenv = require('dotenv');
const s3url = express.Router();
const jwt = require('jsonwebtoken');

dotenv.config();

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

// Configure aws with accessKeyId and secretAccessKey
const s3 = new aws.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
})

// Generates an AWS signed URL for retrieving objects
function generateUploadURL() {
  const rawBytes = crypto.randomBytes(16) // Generate 16 random bytes
  const imageName = rawBytes.toString('hex') // Convert them to hexadecimal format

  const params = ({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageName,
    Expires: 60, // seconds
  })

  const uploadURL = s3.getSignedUrlPromise('putObject', params)
  return uploadURL
}



s3url.get('/', verifyToken, async (req, res) => {
  try {
    const url = await generateUploadURL();
    res.json({ success: true, url });
  } catch (error) {
    console.error('Error generating S3 URL:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


module.exports = s3url;
