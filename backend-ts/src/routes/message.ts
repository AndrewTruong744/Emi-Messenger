import express from "express";
import generalQuery from "../db/generalQuery.js";
import {type User as PrismaUser, Prisma} from '../generated/prisma/client.js'
import passport from "passport";

/*
  TO DO: make error codes more accurate
*/

const router = express.Router();

router.get('/:conversationid',
  passport.authenticate('access-token', {session: false}),
  async (req, res) => {
    try {
      const userId = (req.user as PrismaUser).id;
      const conversationId = req.params.conversationid;
      const prevMessageId = req.query['prevMessageId'] as string | null;
      const messages = await generalQuery.getMessages(conversationId, prevMessageId, userId);
      if (!messages){
        return res.status(404).json({
          error: true,
          message: 'Operation not authorized'
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

router.post('/:conversationId',
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
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
          console.log("Authorization failed: Record not found.");
          return res.status(404).json({
            error: true,
            message: 'Operation not authorized'
          });
        }
        else {
          return res.status(503).json({
            error: true,
            message: 'Database is currently unreachable'
          });
        }
      }

      return res.status(500).json({
        error: true,
        message: 'Server is down'
      });
    }
  }
);

export default router;