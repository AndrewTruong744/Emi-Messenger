import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import { type Request, type Response, type NextFunction } from 'express';

// import and activate all authentication strategies
import "./authentication/passport.js";
import apiRouter from './routes/api.js';

import handleSocketEvents from "./sockets/socket.js";

const app = express();
const httpServer = createServer(app);

// allows webSockets on this server
const io = new Server(httpServer, {
  cors: {
    origin: process.env['ORIGIN'],
    credentials: true
  }
});

// allows io to be used in REST APIs
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cors({
  origin: process.env['ORIGIN'],
  credentials: true
}));
app.use(passport.initialize());

app.use('/api', apiRouter);

// global error handler
app.use((err : any, req : Request, res : Response, next : NextFunction) => {
  console.error(err.stack);

  return res.status(500).json({
    message: 'An unexpected server error occurred'
  });
});

handleSocketEvents(io);

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Express app - listening on port ${PORT}!`);
});