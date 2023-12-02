const express = require('express');
require('dotenv').config()

const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const db = require('./db/db.js'); // Importing the db.js file

const app = express();
const port = 30029;

app.use(bodyParser.json());

// Pool connection
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
