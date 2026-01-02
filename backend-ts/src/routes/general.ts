import express from "express";
import generalQuery from "../db/generalQuery.js";
import authQuery from "../db/authQuery.js";
import passport from "passport";
import {type User as PrismaUser} from '@prisma/client'

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
      const conversations = await generalQuery.getConversations(userId);
      return res.json({conversations});
    } catch (err) {
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable'
      });
    }
  }
);

router.put('/conversation/:id', 
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const io = req.io;
      const userId = (req.user as PrismaUser).id;
      const otherUserId = req.params.id;
      const addedContact = await generalQuery.addContact(userId, otherUserId);
      
      if (addedContact) {
        const roomId = [userId, otherUserId].sort().join("_");
        await io.in(`user-${userId}`).socketsJoin(`room-${roomId}`);
        await io.in(`user-${otherUserId}`).socketsJoin(`room-${roomId}`);

        const userAUsername = await generalQuery.getUsername(userId);
        const userBUsername = await generalQuery.getUsername(otherUserId);

        io.to(`room-${roomId}`).emit('addContact', {
          userA: {id: userId, username: userAUsername}, 
          userB: {id: otherUserId, username: userBUsername},
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

router.get('/messages/:id',
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const userId = (req.user as PrismaUser).id;
      const otherUserId = req.params.id;

      const otherUsername = await generalQuery.getUsername(otherUserId);

      if (!otherUsername) {
        return res.status(404).json({
        error: true,
        message: 'User not found'
      });
      }

      const messages = await generalQuery.getMessages(userId, otherUserId!);
      return res.json({messages});
    } catch (err) {
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable'
      });
    }
  }
);

router.post('/message/:username',
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const io = req.io;
      const userId = (req.user as PrismaUser).id;
      const otherUserId = req.params.username;

      const messageCreated = await generalQuery.addMessage(userId, otherUserId, req.body.message);
      const roomId = [userId, otherUserId].sort().join("_");
      io.to(`room-${roomId}`).emit('sentMessage', messageCreated);

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
    const userId = (req.user as PrismaUser).id;
    const currentUser = await generalQuery.getCurrentUser(userId);
    return res.json({currentUser});
  }
);

// router.put('/current-user')

export default router;