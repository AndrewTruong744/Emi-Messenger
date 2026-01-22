import { type Server, type Socket } from "socket.io";
import cookie from 'cookie';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import generalQuery from "../db/generalQuery.js";
import redis from "../cache/redisClient.js";

function handleSocketEvents(io : Server) {

  // provides information stored in the refresh token to the socket handlers
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
    // make every instance (or tabs) of this user join this user's room so all instances are up to date
    const userRoom = `user-${userId}`;
    socket.join(userRoom);
    console.log(`User connected: ${socket.id}`);

    await redis.sadd(`${userRoom}-online`, socket.id);
    await redis.expire(`${userRoom}-online`, 60);
    const numConnections = await redis.scard(`${userRoom}-online`);

    // every 30 seconds, check to see if there is at least 1 active instance for the user
    const heartBeatTimer = setInterval(async () => {
      try {
        await redis.expire(`${userRoom}-online`, 60);
      } catch(err) {
        console.error("Failed to refresh Redis TTL", err);
      }
    }, 30000);
  
    const conversationIds = await generalQuery.getAllConversationIds(userId);
    for (const conversationId of conversationIds) {
      socket.join(`room-${conversationId}`);
      
      // if this is the first instance on the app, broadcast to all conversations this user is in
      if (numConnections === 1)
        socket.to(`room-${conversationId}`).emit('userOnline', conversationId);
    }
  
    socket.on("disconnect", async () => {
      clearInterval(heartBeatTimer);
      await redis.srem(`${userRoom}-online`, socket.id);
      const remainingConnections = await redis.scard(`${userRoom}-online`);

      if (remainingConnections === 0) {
        await redis.del(`${userRoom}-online`);

        // since no more instances of the user is online, broadcast user offline
        const conversationIds = await generalQuery.getAllConversationIds(userId);
        for (const conversationId of conversationIds) {
          io.to(`room-${conversationId}`).emit('userOffline', conversationId);
        }

        console.log(`User ${userId} is now fully offline.`);
      }

      console.log("User disconnected");
    });
  });
}

export default handleSocketEvents;