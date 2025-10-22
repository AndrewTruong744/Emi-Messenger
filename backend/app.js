import express from "express";
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import path from 'node:path';
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import "./authentication/passport.js";
import apiRouter from './routes/api.js';

const app = express();

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
  if (error) {
    throw error;
  }
  console.log(`Express app - listening on port ${PORT}!`);
});