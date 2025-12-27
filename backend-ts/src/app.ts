import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import 'dotenv/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import path from 'node:path';
import { fileURLToPath } from "node:url";
import jwt, { type JwtPayload } from 'jsonwebtoken';
import cookie from 'cookie';

import { type Request, type Response, type NextFunction } from 'express';
import { type Socket } from "socket.io";

import "./authentication/passport.js";
import apiRouter from './routes/api.js';
import generalQuery from "./db/generalQuery.js";

interface Jwt {
  id: string,
  username: string,
  iat: number,
  exp: number,
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const assetsPath = path.join(__dirname, 'public');
app.use(express.static(assetsPath));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cors({
  origin: process.env['ORIGIN'],
  credentials: true
}));
app.use(passport.initialize());

app.use('/api', apiRouter);

app.use((err : any, req : Request, res : Response, next : NextFunction) => {
  console.error(err.stack);

  return res.status(500).json({
    message: 'An unexpected server error occurred'
  });
});

io.use((socket : Socket, next : (err?: Error) => void) => {
  const headerCookie = socket.handshake.headers.cookie;

  if (!headerCookie)
    return next(new Error("Authentication error: No cookies found"));

  const cookies = cookie.parse(headerCookie);
  const refreshToken = cookies['refreshToken'];

  if (!refreshToken)
    return next(new Error("Authentication error: Refresh token missing"));

  jwt.verify(refreshToken, process.env['REFRESH_TOKEN_SECRET']!, {}, (err : any, decoded) => {
    if (err)
      return next(new Error("Authentication error: Invalid token"));

    const payload = decoded as JwtPayload;

    socket.user = {
      id: payload['id'],
      username: payload['username']
    };
    
    next();
  });
});

io.on("connection", async (socket : Socket) => {
  const userId = socket.user!.id;
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
httpServer.listen(PORT, () => {
  console.log(`Express app - listening on port ${PORT}!`);
});