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
const get_user = require('./routes/get_user');
const registerRoutes = require('./routes/register');
const loginRoutes = require('./routes/login');
const get_clubs_roles = require('./routes/get_clubs_roles');
app.use('/get_user', get_user);
app.use('/register', registerRoutes);
app.use('/login', loginRoutes);
app.use('/get_clubs_roles', get_clubs_roles);


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
