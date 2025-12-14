import express from "express";
import generalQuery from "../db/generalQuery.js";
import passport from "passport";

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
      const userId = req.user.id;
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

router.put('/conversation/:username', 
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const otherUserId = await generalQuery.getDatabaseId(req.params.username);
      await generalQuery.addContact(userId, otherUserId);

      return res.json({message: "success!"});
    } catch (err) {
      return res.status(503).json({
        error: true,
        message: 'Database is currently unreachable'
      });
    }
  }
);

router.get('/messages/:username',
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const otherUserId = await generalQuery.getDatabaseId(req.params.username);
      const messages = await generalQuery.getMessages(userId, otherUserId);
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
      const userId = req.user.id;
      const otherUserId = await generalQuery.getDatabaseId(req.params.username);
      await generalQuery.addMessage(userId, otherUserId, req.body.message);
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
    const userId = req.user.id;
    const currentUser = await generalQuery.getCurrentUser(userId);
    return res.json({currentUser});
  }
);

export default router;