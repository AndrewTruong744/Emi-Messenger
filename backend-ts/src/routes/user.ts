import express from "express";
import generalQuery from "../db/generalQuery.js";
import {type User as PrismaUser, Prisma} from '@prisma/client'
import passport from "passport";

/*
  TO DO: make error codes more accurate
*/

const router = express.Router();

// gets information related to the user initiating the request
router.get('/me', 
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

// updating the user initiating the request's username
router.put('/me',
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const io = req.io;
      const userId = (req.user as PrismaUser).id;
      const newUsername = req.body.username;
      const result = await generalQuery.updateUsername(userId, newUsername);

      if (result === 'invalid') {
        return res.status(404).json({
          error: true,
          message: 'Operation not authorized'
        })
      }

      for (const conversationId of result) {
        io.in(`room-${conversationId}`).emit('usernameChange', {
          userId: userId,
          username: newUsername
        });
      }

      return res.json({message: "success"});
    } catch (err) {
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable'
      });
    }
  }
)

// delete the user initiating the request's account
router.delete('/me',
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

      // tells this user's tabs that their account was deleted
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

// get a list of users
router.get('/', 
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const userId = (req.user as PrismaUser).id;
      const users = await generalQuery.getUsers('', userId);
      return res.json({users});
    } catch (err) {
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable'
      });
    }
  }
);

// get a list of users starting with username
router.get('/:username', 
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const userId = (req.user as PrismaUser).id;
      const username = (req.params.username) ? req.params.username : '?';
      const users = await generalQuery.getUsers(username, userId);

      return res.json({users});
    } catch (err) {
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable'
      })
    }
  }
);

export default router;

