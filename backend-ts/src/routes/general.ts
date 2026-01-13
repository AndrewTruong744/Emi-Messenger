import express from "express";
import generalQuery from "../db/generalQuery.js";
import passport from "passport";
import {type User as PrismaUser} from '@prisma/client'
import redis from "../cache/redisClient.js";

const router = express.Router();

router.get('/users', 
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const users = await generalQuery.getUsers('');
      return res.json({users});
    } catch (err) {
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable'
      })
    }
  }
);

router.get('/users/:username', 
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const username = (req.params.username) ? req.params.username : '?';
      const users = await generalQuery.getUsers(username);

      return res.json({users});
    } catch (err) {
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable'
      })
    }
  }
);

router.get('/conversations',
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const userId = (req.user as PrismaUser).id;
      const conversationsAndUsernames = await generalQuery.getConversations(userId);
      return res.json(conversationsAndUsernames);
    } catch (err) {
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable'
      });
    }
  }
);

// add your own userId to userIds
router.put('/conversation', 
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const io = req.io;
      const userIds = req.body.userIds;
      const usernames = req.body.usernames;
      const addedConversation = await generalQuery.addConversation(userIds as string[]);
      
      if (addedConversation) {
        userIds.forEach(async (otherUserId : string) => {
          await io.in(`user-${otherUserId}`).socketsJoin(`room-${addedConversation.id}`);
        });

        let online = null;
        if (userIds.length < 3) {
          const userAOnline = await redis.exists(`user-${userIds[0]}-online`);
          const userBOnline = await redis.exists(`user-${userIds[1]}-online`);
          online = {[userIds[0] as string]: userAOnline === 1, [userIds[1] as string]: userBOnline === 1}; 
        }

        // we let frontend handle parsing the name
        io.to(`room-${addedConversation.id}`).emit('addConversation', {
          id: addedConversation.id,
          name: addedConversation.name,
          isGroup: userIds.length > 2,
          recentMessage: null,
          online: online, // always false for group chats
          timeStamp: new Date(),
          participants: userIds,
          participantNames: usernames
        });
      }

      return res.json({message: "success!"});
    } catch (err) {
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable: ' + err
      });
    }
  }
);

// make sure user is in conversation before deleting
router.delete('/conversation/:id', 
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const io = req.io;
      const conversationId = req.params.id;
      await generalQuery.deleteConversation(conversationId);
      await io.in(`room-${conversationId}`).emit('conversationDeleted');
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

// make sure user is in conversation before getting messages
router.get('/messages/:conversationid',
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const userId = (req.user as PrismaUser).id;
      const conversationId = req.params.conversationid;
      const previousMessageId = req.query['previousMessageId'] as string;

      const messages = await generalQuery.getMessages(conversationId, previousMessageId);
      if (!messages){
        return res.status(404).json({
          error: true,
          message: 'Conversation not found'
        });
      }

      return res.json({messages});
    } catch (err) {
      console.log(err);
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable'
      });
    }
  }
);

// make sure user is in conversation before posting a message
router.post('/message/:conversationId',
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const io = req.io;
      const userId = (req.user as PrismaUser).id;
      const conversationId = req.params.conversationId;

      const messageCreated = await generalQuery.addMessage(conversationId, userId, req.body.message);
      io.to(`room-${conversationId}`).emit('sentMessage', messageCreated);

      return res.status(201).json({message: "success!"});
    } catch (err) {
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable'
      });
    }
  }
);

router.get('/current-user', 
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const userId = (req.user as PrismaUser).id;
      const currentUser = await generalQuery.getCurrentUser(userId);
      return res.json({currentUser});
    }
    catch (err) {
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable'
      });
    }
  }
);

router.delete('/current-user',
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const userId = (req.user as PrismaUser).id;
      const conversationsAndUsernames = await generalQuery.getConversations(userId);
      await generalQuery.deleteUserData(userId);

      const io = req.io;

      // tells users in this user's conversations that this user was deleted.
      // delete all conversations that have this user
      for (const conversation of conversationsAndUsernames.conversationList!) {
        await io.in(`room-${conversation.id}`).emit('conversationDeleted', conversation.id);
        await io.in(`room-${conversation.id}`).socketsLeave(`room-${conversation.id}`);
      }

      // tells the user's tabs that their account was deleted
      io.to(`user-${userId}`).emit('accountDeleted');

      return res.json({message: "success!"});
    }
    catch (err) {
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable'
      });
    }
  }
);

export default router;