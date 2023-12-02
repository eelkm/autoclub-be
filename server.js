// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const bodyParser = require('body-parser');
const db = require('./db/db.js');
const app = express();
const port = 5000;

// Middleware for handling CORS and parsing JSON
app.use(cors());
app.use(bodyParser.json());

// Pool connection middleware
app.use(async (req, res, next) => {
  try {
    req.db = db;
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Routes
const userRoutes = require('./routes/users');
const registerRoutes = require('./routes/register');
const loginRoutes = require('./routes/login');
app.use('/users', userRoutes);
app.use('/register', registerRoutes);
app.use('/login', loginRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
