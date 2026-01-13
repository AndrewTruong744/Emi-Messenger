import { type Server, type Socket } from "socket.io";
import cookie from 'cookie';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import generalQuery from "../db/generalQuery.js";
import redis from "../cache/redisClient.js";

function handleSocketEvents(io : Server) {
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
    const userRoom = `user-${userId}`;
    socket.join(userRoom);
    console.log(`User connected: ${socket.id}`);

    await redis.sadd(`${userRoom}-online`, socket.id);
    await redis.expire(`${userRoom}-online`, 60);
    const numConnections = await redis.scard(`${userRoom}-online`);

    const heartBeatTimer = setInterval(async () => {
      try {
        await redis.expire(`${userRoom}-online`, 60);
      } catch(err) {
        console.error("Failed to refresh Redis TTL", err);
      }
    }, 30000);
  
    const conversationsAndUsernames = await generalQuery.getConversations(userId);
    for (const conversation of conversationsAndUsernames.conversationList!) {
      socket.join(`room-${conversation.id}`);

      if (numConnections === 1 && !conversation.isGroup)
        socket.to(`room-${conversation.id}`).emit('userOnline', { 
          id : conversation.id
        });
    }
  
    socket.on("disconnect", async () => {
      clearInterval(heartBeatTimer);
      const removed = await redis.srem(`${userRoom}-online`, socket.id);
      console.log("removed: " + removed);
      const remainingConnections = await redis.scard(`${userRoom}-online`);
      console.log(remainingConnections);
      if (remainingConnections === 0) {
        await redis.del(`${userRoom}-online`);

        const conversationsAndUsernames = await generalQuery.getConversations(userId);
        for (const conversation of conversationsAndUsernames.conversationList!) {
          io.to(`room-${conversation.id}`).emit('userOffline', {
          id : conversation.id
        });
        }

        console.log(`User ${userId} is now fully offline.`);
      }

      console.log("User disconnected");
    });
  });
}

export default handleSocketEvents;