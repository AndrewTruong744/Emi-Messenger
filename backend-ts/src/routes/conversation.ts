import express from "express";
import generalQuery from "../db/generalQuery.js";
import passport from "passport";
import {type User as PrismaUser, Prisma} from '@prisma/client'
import redis from "../cache/redisClient.js";

const router = express.Router();

// implement pagination
router.get('/',
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const userId = (req.user as PrismaUser).id;
      const conversationsAndUsernames = await generalQuery.getConversations(userId, null);
      return res.json(conversationsAndUsernames);
    } catch (err) {
      console.log(err);
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable' + err
      });
    }
  }
);

// make sure to limit each user to 500 conversations
router.post('/', 
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const io = req.io;
      const userIds = req.body.userIds;
      const usernames = req.body.usernames;
      const addedConversation = await generalQuery.addConversation(userIds as string[], usernames as string[]);
      
      if (addedConversation && addedConversation.created) {
        const conversation = addedConversation.conversation;

        for (const userId of userIds) {
          await io.in(`user-${userId}`).socketsJoin(`room-${conversation.id}`);
        }

        if (userIds.length < 3) {
          const userAOnline = await redis.exists(`user-${userIds[0]}-online`);
          const userBOnline = await redis.exists(`user-${userIds[1]}-online`);

          io.to(`user-${userIds[0]}`).emit('addConversation', {
            ...conversation,
            online: userBOnline === 1 ? true : false,
            participants: userIds,
            participantNames: usernames
          });

          io.to(`user-${userIds[1]}`).emit('addConversation', {
            ...conversation,
            online: userAOnline === 1 ? true : false,
            participants: userIds,
            participantNames: usernames
          });
        }
        else {
          io.to(`room-${conversation.id}`).emit('addConversation', {
            ...conversation,
            online: false, // always false for group chats
            participants: userIds,
            participantNames: usernames
          });
        }
      }

      return res.json({conversationId: addedConversation!.conversation.id});
    } catch (err) {
      console.log(err);
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable: ' + err
      });
    }
  }
);

// updating a conversation name
router.put('/:id', 
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const io = req.io;
      const userId = (req.user as PrismaUser).id;
      const conversationId = req.params.id;
      const newName = req.body.name;
      const result = await generalQuery.updateConversationName(conversationId, userId, newName);

      if (result === 'invalid') {
        return res.status(404).json({
          error: true,
          message: 'Operation not authorized'
        });
      }

      io.in(`room-${conversationId}`).emit('conversationNameChange', {
        conversationId: conversationId,
        name: newName
      });

      return res.json({message: "success"});
    } catch (err) {
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable: ' + err
      });
    }
  }
);

router.delete('/:id', 
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const io = req.io;
      const conversationId = req.params.id;
      const userId = (req.user as PrismaUser).id;
      const result = await generalQuery.deleteConversation(conversationId, userId);

      if (result === "invalid") {
        return res.status(404).json({
          error: true,
          message: 'Operation not authorized'
        });
      }

      await io.in(`room-${conversationId}`).emit('conversationDeleted', conversationId);
      await io.in(`room-${conversationId}`).socketsLeave(`room-${conversationId}`);
      return res.json({message: "success!!"});
    } catch (err) {
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable: ' + err
      });
    }
  }
);

export default router;