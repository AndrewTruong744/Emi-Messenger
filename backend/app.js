import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import path from 'node:path';
import { fileURLToPath } from "node:url";
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import "./authentication/passport.js";
import apiRouter from './routes/api.js';
import generalQuery from "./db/generalQuery.js";

const app = express();
const httpServer = createServer(app);

// allows webSockets on this server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ORIGIN,
    credentials: true
  }
});

// allows io to be used in REST APIs
app.use((req, res, next) => {
  req.io = io;
  next();
});

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
});

io.use((socket, next) => {
  const headerCookie = socket.handshake.headers.cookie;

  if (!headerCookie)
    return next(new Error("Authentication error: No cookies found"));

  const cookies = cookie.parse(headerCookie);
  const refreshToken = cookies.refreshToken;

  if (!refreshToken)
    return next(new Error("Authentication error: Refresh token missing"));

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err)
      return next(new Error("Authentication error: Invalid token"));

    socket.user = {
      id: decoded.id,
      username: decoded.username
    };
    
    next();
  });
});

io.on("connection", async (socket) => {
  const userId = socket.user.id;
  socket.join(`user-${userId}`);
  console.log(`User connected: ${socket.id}`);

  const conversations = await generalQuery.getConversations(userId);
  for (const conversation of conversations) {
    const roomId = [userId, conversation.id].sort().join("_");
    socket.join(`room-${roomId}`);
  }
  
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = 3000;
httpServer.listen(PORT, (err) => {
  if (err) {
    throw err;
  }
  console.log(`Express app - listening on port ${PORT}!`);
});