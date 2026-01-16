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

// implement pagination
router.get('/conversations',
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

// add your own userId to userIds
// make sure to limit each user to 500 conversations
router.put('/conversation', 
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
// router.put('/conversation/:id',)

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
      const prevMessageId = req.query['prevMessageId'] as string | null;
      console.log("prev: " + prevMessageId);
      const messages = await generalQuery.getMessages(conversationId, prevMessageId);
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

// update
router.delete('/current-user',
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const userId = (req.user as PrismaUser).id;
      const conversationIds = await generalQuery.getAllConversationIds(userId);
      await generalQuery.deleteUserData(userId);

      const io = req.io;

      // tells users in this user's conversations that this user was deleted.
      // delete all conversations that have this user
      for (const conversationId of conversationIds) {
        await io.in(`room-${conversationId}`).emit('conversationDeleted', conversationId);
        await io.in(`room-${conversationId}`).socketsLeave(`room-${conversationId}`);
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