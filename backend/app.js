const express = require("express");
require('dotenv').config();
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser');
const passport = require("passport");
const path = require("node:path");

require('./authentication/passport.js');
const apiRouter = require('./routes/api.js');

const assetsPath = path.join(__dirname, 'public');
app.use(express.static(assetsPath));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cors({
  origin: process.env.ORIGIN,
  credentials: true
}));
app.use(passport.initialize());

app.use('/api', apiRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);

  return res.status(500).json({
    message: 'An unexpected server error occurred'
  });
})

const PORT = 3000;
app.listen(PORT, (error) => {
  // This is important!
  // Without this, any startup errors will silently fail
  // instead of giving you a helpful error message.
  if (error) {
    throw error;
  }
  console.log(`Express app - listening on port ${PORT}!`);
});